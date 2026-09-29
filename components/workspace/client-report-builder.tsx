import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogField,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { SortableList } from '@/components/ui/sortable-list';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import {
  asAtColumns,
  asAtLabel,
  CONTENT_NAMES,
  clientReportName,
  coverLine,
  coerceCompare,
  compareOptions,
  DEMO_TODAY,
  fileNameFor,
  formatDate,
  FS_CONTENTS,
  packColumns,
  periodLabel,
  readinessChecks,
  shapeLabel,
  shapeOptions,
  signingDirectors,
  STANDARD_LABEL,
  templateShape,
  type ClientReport,
  type CompareWith,
  type PeriodShape,
  type ReadinessCheck,
  type ReportPeriod,
  type TemplatePage,
  type Templates,
} from '@/components/workspace/client-report-data';
import {
  PanelBackLink,
  PanelNavItem,
  PanelNavSection,
  TwoPanel,
} from '@/components/workspace/panel-nav';
import { DEFAULT_PERIOD } from '@/components/workspace/period-selector';
import {
  ALL_REPORTS,
  DEFAULT_LEDGER_ACCOUNT,
  REPORT_DETAILS,
  reportName,
  type Row,
} from '@/components/workspace/report-data';
import {
  buildLedgerDetail,
  StatementTable,
  ToolbarSelect,
} from '@/components/workspace/report-detail';
import type { Company } from '@/lib/companies';
import { cn } from '@/lib/utils';
import {
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Download,
  FileText,
  Lock,
  Send,
} from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

type Props = {
  report: ClientReport;
  company: Company;
  templates: Templates;
  onBack: () => void;
  onChange: (patch: Partial<ClientReport>) => void;
  onNewVersion: () => void;
  onFixInTemplates: (page: TemplatePage) => void;
  onNavigate: (targetKey: string, targetTab?: string) => void;
};

type Section = { key: string; name: string; included: boolean };

export function ClientReportBuilder(props: Props) {
  const { report, onBack, onChange } = props;
  const isMa = report.type === 'ma';
  const editable = report.status === 'draft';
  const sections: Section[] = isMa
    ? report.contents.map((c) => ({ key: c.key, name: CONTENT_NAMES[c.key], included: c.included }))
    : FS_CONTENTS.map((c) => ({ ...c, included: true }));
  const [selected, setSelected] = React.useState(
    () => sections.find((s) => s.included)?.key ?? sections[0].key
  );
  // One page per included section; the contents list jumps to them.
  const pageRefs = React.useRef<Record<string, View | null>>({});

  function select(key: string) {
    setSelected(key);
    // After the render that (re)creates the page.
    setTimeout(() => {
      const node = pageRefs.current[key] as unknown as HTMLElement | null;
      if (node && typeof node.scrollIntoView === 'function') {
        // Clear the sticky page title + tabs above the card.
        node.style.scrollMarginTop = '200px';
        node.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  }

  function toggle(key: string) {
    const turningOn = !report.contents.find((c) => c.key === key)?.included;
    onChange({
      contents: report.contents.map((c) => (c.key === key ? { ...c, included: !c.included } : c)),
    });
    if (turningOn) select(key);
  }

  function move(from: number, to: number) {
    onChange({ contents: moveItem(report.contents, from, to) });
  }

  const renderSection = (section: Section, handle?: React.ReactNode) => (
    <PanelNavItem
      key={section.key}
      label={section.name}
      active={section.key === selected}
      muted={!section.included}
      // A left-out section has no page to jump to — its row includes it instead.
      onPress={() => (section.included ? select(section.key) : editable && toggle(section.key))}
      leading={
        isMa ? (
          <Pressable
            onPress={() => toggle(section.key)}
            disabled={!editable}
            role="checkbox"
            aria-checked={section.included}
            accessibilityLabel={`Include ${section.name}`}
            hitSlop={6}
            className={cn('web:cursor-pointer', !editable && 'opacity-50')}>
            <Checkbox checked={section.included} tone="primary" size="sm" />
          </Pressable>
        ) : undefined
      }
      trailing={handle}
    />
  );

  return (
    <TwoPanel
      mobileNav="stacked"
      nav={
        <>
          <PanelBackLink label="Client reports" onPress={onBack} />
          <PanelNavSection label="Contents" first>
            {isMa ? (
              <SortableList
                items={sections}
                keyOf={(section) => section.key}
                labelOf={(section) => section.name}
                onMove={move}
                disabled={!editable}
                renderItem={(section, _i, handle) => renderSection(section, handle)}
              />
            ) : (
              sections.map((section) => renderSection(section))
            )}
          </PanelNavSection>
        </>
      }>
      <BuilderMain {...props} sections={sections} pageRefs={pageRefs} />
    </TwoPanel>
  );
}

/** `list` with the item at `from` moved to `to`. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// ---------------------------------------------------------------------------------------------
// Right panel
// ---------------------------------------------------------------------------------------------

function BuilderMain({
  report,
  company,
  templates,
  onChange,
  onNewVersion,
  onFixInTemplates,
  onNavigate,
  sections,
  pageRefs,
}: Props & {
  sections: Section[];
  pageRefs: React.MutableRefObject<Record<string, View | null>>;
}) {
  const toast = useToast();
  const [dialog, setDialog] = React.useState<'publish' | 'send' | 'signature' | null>(null);
  const isMa = report.type === 'ma';
  const today = formatDate(DEMO_TODAY);
  const checks = readinessChecks(templates.fs);
  const blocking = checks.filter((c) => c.blocking && !c.done);

  const templateCompare = coerceCompare(report.period.frequency, templates.ma.compareWith);
  const compare = report.compare ?? templateCompare;
  const shape = report.shape ?? templateShape(report.period.frequency);
  const differs =
    (report.compare && report.compare !== templateCompare) ||
    (report.shape && report.shape !== templateShape(report.period.frequency));
  const editable = report.status === 'draft';

  const fileName = fileNameFor(templates.ma.fileName, templates.ma.capitals, {
    created: report.created,
    entity: company.name,
    type: report.type,
    period: report.period,
  });

  function exportPack() {
    toast.show({
      title: `Export ${clientReportName(report)}`,
      description: 'Exporting to PDF and Excel is coming soon.',
      icon: Download,
    });
  }

  const steps = isMa
    ? ['Draft', 'Published', 'Sent']
    : ['Checks', 'Draft', 'Sent for signature', 'Signed'];
  const stepIndex = {
    'not-started': 0,
    draft: isMa ? 0 : 1,
    published: 1,
    sent: 3,
    'sent-for-signature': 2,
    signed: 4,
  }[report.status];

  let primary: React.ReactNode = null;
  let secondary: React.ReactNode = null;
  if (report.status === 'draft' && isMa) {
    primary = (
      <Button onPress={() => setDialog('publish')}>
        <Text>Publish</Text>
      </Button>
    );
  } else if (report.status === 'published') {
    primary = (
      <Button onPress={() => setDialog('send')}>
        <Icon as={Send} size={16} />
        <Text>Send to client</Text>
      </Button>
    );
  } else if (report.status === 'not-started') {
    primary = (
      <Button onPress={() => onChange({ status: 'draft', lastActivity: `Draft started ${today}` })}>
        <Text>Start draft</Text>
      </Button>
    );
  } else if (report.status === 'draft') {
    primary = (
      <Button disabled={blocking.length > 0} onPress={() => setDialog('signature')}>
        <Icon as={Send} size={16} />
        <Text>Send for signature</Text>
      </Button>
    );
  } else if (report.status === 'signed') {
    secondary = (
      <Button variant="outline" onPress={exportPack}>
        <Icon as={Download} size={16} />
        <Text>Download</Text>
      </Button>
    );
  }
  if (report.status === 'published' || report.status === 'sent') {
    secondary = (
      <Button variant="outline" onPress={onNewVersion}>
        <Text>Create new version</Text>
      </Button>
    );
  }

  return (
    <View className="gap-6 p-6 md:p-8">
      <View className="gap-4 md:flex-row md:items-start md:justify-between">
        <View className="min-w-0 flex-1 gap-1.5">
          <View className="flex-row flex-wrap items-center gap-3">
            <Text variant="h3">{clientReportName(report)}</Text>
            {report.version > 1 && (
              <View className="rounded-md bg-muted px-2 py-1">
                <Text className="text-sm text-muted-foreground">Version {report.version}</Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-muted-foreground" selectable>
            {fileName}
          </Text>
        </View>
        {(primary || secondary) && (
          <View className="flex-row items-center gap-2">
            {secondary}
            {primary}
          </View>
        )}
      </View>

      <ProgressSteps steps={steps} current={stepIndex} />

      <View className="flex-row flex-wrap items-center gap-2">
        {isMa && (
          <>
            <ToolbarSelect
              label="Period"
              value={shape}
              disabled={!editable}
              options={shapeOptions(report.period)}
              onValueChange={(v) => onChange({ shape: v as PeriodShape })}
            />
            <ToolbarSelect
              label="Compare"
              value={compare}
              disabled={!editable}
              options={compareOptions(report.period.frequency)}
              onValueChange={(v) => onChange({ compare: v as CompareWith })}
            />
          </>
        )}
        <Button variant="outline" onPress={exportPack}>
          <Icon as={Download} size={16} />
          <Text>Export</Text>
        </Button>
        {differs && editable && (
          <View className="flex-row items-center gap-1.5 pl-2">
            <Text className="text-sm text-muted-foreground">Differs from template ·</Text>
            <Pressable
              onPress={() => onChange({ compare: undefined, shape: undefined })}
              accessibilityRole="button"
              className="web:cursor-pointer">
              <Text className="text-sm text-brand web:hover:underline">Reset</Text>
            </Pressable>
          </View>
        )}
      </View>

      {report.lockedOn && (
        <View className="flex-row items-center gap-2 rounded-lg bg-muted px-4 py-3">
          <Icon as={Lock} size={16} className="text-muted-foreground" />
          <Text className="text-sm text-muted-foreground">Figures locked on {report.lockedOn}</Text>
        </View>
      )}

      {report.type === 'fs' && report.status === 'draft' && blocking.length > 0 && (
        <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border px-4 py-3">
          <Icon as={CircleAlert} size={16} className="text-destructive-text" />
          <Text className="text-sm text-foreground">
            Choose signing directors before sending for signature.
          </Text>
          <FixLink
            check={blocking[0]}
            onFixInTemplates={onFixInTemplates}
            onNavigate={onNavigate}
          />
        </View>
      )}

      {report.status === 'not-started' && (
        <ReadinessCard
          checks={checks}
          onFixInTemplates={onFixInTemplates}
          onNavigate={onNavigate}
        />
      )}

      <Pages
        sections={sections.filter((s) => s.included)}
        pageRefs={pageRefs}
        footer={`${templates.fs.entity.legalName} · ${clientReportName(report)}`}
        render={(key) => (
          <PreviewSection
            report={report}
            company={company}
            templates={templates}
            sectionKey={key}
            compare={compare}
            shape={shape}
            editable={editable}
            onCommentaryChange={(commentary) => onChange({ commentary })}
          />
        )}
      />

      <PublishDialog
        open={dialog === 'publish'}
        onOpenChange={(open) => setDialog(open ? 'publish' : null)}
        onReview={() => {
          setDialog(null);
          onNavigate('work');
        }}
        onPublish={() => {
          setDialog(null);
          onChange({ status: 'published', lockedOn: today, lastActivity: `Published ${today}` });
          toast.show({
            title: 'Published',
            description: `Figures locked on ${today}.`,
            icon: Lock,
          });
        }}
      />
      <SendDialog
        open={dialog === 'send'}
        onOpenChange={(open) => setDialog(open ? 'send' : null)}
        report={report}
        company={company}
        templates={templates}
        fileName={fileName}
        onSend={(recipientName) => {
          setDialog(null);
          onChange({ status: 'sent', recipient: recipientName, lastActivity: `Sent ${today}` });
          toast.show({
            title: 'Sent to client',
            description: clientReportName(report),
            icon: Send,
          });
        }}
      />
      <SignatureDialog
        open={dialog === 'signature'}
        onOpenChange={(open) => setDialog(open ? 'signature' : null)}
        signers={signingDirectors(templates.fs).map((d) => d.name)}
        onSend={() => {
          setDialog(null);
          onChange({
            status: 'sent-for-signature',
            lockedOn: today,
            lastActivity: `Sent for signature ${today}`,
          });
          toast.show({
            title: 'Sent for signature',
            description: clientReportName(report),
            icon: Send,
          });
        }}
      />
    </View>
  );
}

/** Where the report is in its life, in a single light row under the title. Finished steps
 * turn green with a tick, the current one is bold. `current` past the last step means every
 * step is finished. */
function ProgressSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <View
      role="list"
      aria-label="Progress"
      className="flex-row flex-wrap items-center gap-x-4 gap-y-2 py-1">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={step}>
            {i > 0 && (
              <View
                style={{ width: 40 }}
                className={cn('h-px', i <= current ? 'bg-success' : 'bg-border')}
              />
            )}
            <View
              role="listitem"
              aria-current={active ? 'step' : undefined}
              className="flex-row items-center gap-2.5">
              <View
                style={{ width: 24, height: 24 }}
                className={cn(
                  'items-center justify-center rounded-full',
                  done ? 'bg-success' : active ? 'bg-primary' : 'border border-border'
                )}>
                {done ? (
                  <Icon as={Check} size={14} strokeWidth={3} className="text-white" />
                ) : (
                  <Text
                    className={cn(
                      'text-xs',
                      active
                        ? 'font-plex-semibold text-primary-foreground'
                        : 'text-muted-foreground'
                    )}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                className={cn(
                  'text-sm',
                  active
                    ? 'font-plex-semibold text-foreground'
                    : done
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                )}>
                {step}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Readiness checks (financial statements, not started)
// ---------------------------------------------------------------------------------------------

function ReadinessCard({
  checks,
  onFixInTemplates,
  onNavigate,
}: {
  checks: ReadinessCheck[];
  onFixInTemplates: (page: TemplatePage) => void;
  onNavigate: (targetKey: string, targetTab?: string) => void;
}) {
  const ready = checks.filter((c) => c.done).length;
  return (
    <View className="overflow-hidden rounded-2xl border border-border">
      <View className="gap-3 border-b border-border px-5 py-4">
        <Text className="font-plex-semibold text-base text-foreground">
          {ready} of {checks.length} ready
        </Text>
        <Progress value={(ready / checks.length) * 100} indicatorClassName="bg-success" />
      </View>
      {checks.map((check, i) => (
        <View
          key={check.key}
          className={cn(
            'flex-row flex-wrap items-center gap-3 px-5 py-3.5',
            i > 0 && 'border-t border-border'
          )}>
          <Icon
            as={check.done ? Check : CircleAlert}
            size={16}
            className={
              check.done
                ? 'text-success'
                : check.blocking
                  ? 'text-destructive-text'
                  : 'text-warning'
            }
          />
          <Text
            className={cn(
              'min-w-0 flex-1 text-sm',
              check.done ? 'text-success-text' : 'text-foreground'
            )}>
            {check.label}
            {check.blocking && !check.done ? (
              <Text className="text-sm text-muted-foreground"> · Needed for signature</Text>
            ) : null}
          </Text>
          {!check.done && (
            <FixLink check={check} onFixInTemplates={onFixInTemplates} onNavigate={onNavigate} />
          )}
        </View>
      ))}
    </View>
  );
}

function FixLink({
  check,
  onFixInTemplates,
  onNavigate,
}: {
  check: ReadinessCheck;
  onFixInTemplates: (page: TemplatePage) => void;
  onNavigate: (targetKey: string, targetTab?: string) => void;
}) {
  const fix = check.fix;
  if (!fix) return null;
  return (
    <Pressable
      onPress={() =>
        fix.kind === 'template' ? onFixInTemplates(fix.page) : onNavigate(fix.target, fix.tab)
      }
      accessibilityRole="link"
      className="web:cursor-pointer">
      <Text className="text-sm text-brand web:hover:underline">{fix.label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------------------------

/** The whole pack as it will be sent — a sheet of paper per included section, in order, on a
 * grey desk. Leaving a section out removes its page; reordering moves it. */
function Pages({
  sections,
  pageRefs,
  footer,
  render,
}: {
  sections: Section[];
  pageRefs: React.MutableRefObject<Record<string, View | null>>;
  footer: string;
  render: (key: string) => React.ReactNode;
}) {
  return (
    <View className="gap-6 rounded-2xl bg-muted p-3 md:p-8">
      {sections.length === 0 ? (
        <Text className="py-16 text-center text-sm text-muted-foreground">
          Tick a section in Contents to add it to this report.
        </Text>
      ) : (
        sections.map((section, i) => (
          <View
            key={section.key}
            ref={(node) => {
              pageRefs.current[section.key] = node;
            }}
            style={{ minHeight: section.key === 'cover' ? 560 : 360 }}
            className="rounded border border-border bg-white p-6 shadow-sm shadow-black/5 md:p-12">
            <View className="flex-1">{render(section.key)}</View>
            {section.key !== 'cover' && (
              <View className="mt-10 flex-row justify-between gap-4 border-t border-border pt-4">
                <Text className="shrink text-xs text-muted-foreground" numberOfLines={1}>
                  {footer}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Page {i + 1} of {sections.length}
                </Text>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );
}

function PaperHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="gap-1 pb-6">
      <Text className="font-plex-bold text-xl text-foreground">{title}</Text>
      {subtitle && <Text className="text-sm text-muted-foreground">{subtitle}</Text>}
    </View>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <Text className="pb-4 text-sm leading-6 text-foreground">{children}</Text>;
}

/** The pack's column headings for a shape ("Mar 2027", "Jan – Mar 2027", "FY2027"). */
function shapedPeriod(period: ReportPeriod, shape: PeriodShape): ReportPeriod {
  const frequency = shape === 'month' ? 'monthly' : shape === 'quarter' ? 'quarterly' : 'yearly';
  return { frequency, end: period.end };
}

function PreviewSection({
  report,
  company,
  templates,
  sectionKey,
  compare,
  shape,
  editable,
  onCommentaryChange,
}: {
  report: ClientReport;
  company: Company;
  templates: Templates;
  sectionKey: string;
  compare: CompareWith;
  shape: PeriodShape;
  editable: boolean;
  onCommentaryChange: (text: string) => void;
}) {
  const { fs } = templates;
  const legal = fs.entity.legalName;
  const yearEnd = `31 March ${report.period.end.slice(0, 4)}`;
  let columns = packColumns(
    shapedPeriod(report.period, shape),
    report.type === 'fs' ? 'same-last-year' : compare
  );

  if (sectionKey === 'cover') {
    return (
      <View style={{ minHeight: 460 }} className="justify-between">
        <Text className="font-plex-semibold text-base text-foreground">{legal}</Text>
        <View className="gap-6">
          <View className="gap-2">
            <Text className="font-plex-bold text-4xl tracking-tight text-foreground">
              {report.type === 'ma' ? 'Management accounts' : 'Financial statements'}
            </Text>
            <Text className="text-lg text-muted-foreground">
              {report.type === 'ma'
                ? coverLine(report.period, shape)
                : `For the financial year ended ${yearEnd}`}
            </Text>
          </View>
          <View className="border-t border-border pt-4">
            <Text className="text-sm text-muted-foreground">
              {report.type === 'ma'
                ? `Prepared by Sleek for the directors of ${company.name}`
                : `UEN ${fs.entity.uen} · Prepared under ${STANDARD_LABEL[fs.standard]}`}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (sectionKey === 'commentary') {
    return (
      <View>
        <PaperHeading title="Commentary" subtitle={shapeLabel(report.period, shape)} />
        {editable ? (
          <Input
            multiline
            value={report.commentary}
            onChangeText={onCommentaryChange}
            placeholder="Add commentary for the directors"
            accessibilityLabel="Commentary"
            style={{ minHeight: 220, textAlignVertical: 'top' }}
            className="h-auto py-3 leading-6 sm:h-auto"
          />
        ) : report.commentary ? (
          report.commentary.split('\n\n').map((p, i) => <Paragraph key={i}>{p}</Paragraph>)
        ) : (
          <Text className="text-sm text-muted-foreground">No commentary.</Text>
        )}
      </View>
    );
  }

  if (sectionKey === 'directors-statement') {
    const signers = signingDirectors(fs);
    return (
      <View>
        <PaperHeading title="Directors' statement" />
        <Paragraph>
          The directors present their statement together with the financial statements of {legal}{' '}
          for the financial year ended {yearEnd}.
        </Paragraph>
        <Paragraph>
          In the opinion of the directors, the financial statements give a true and fair view of the
          financial position of the company as at {yearEnd}, and at the date of this statement there
          are reasonable grounds to believe that the company will be able to pay its debts as and
          when they fall due.
        </Paragraph>
        {signers.length === 0 ? (
          <Text className="pt-4 text-sm text-destructive-text">Signing directors not chosen</Text>
        ) : (
          <View className="flex-row flex-wrap gap-12 pt-8">
            {signers.map((d) => (
              <View
                key={d.id}
                className="gap-1 border-t border-foreground pt-2"
                style={{ width: 200 }}>
                <Text className="text-sm text-foreground">{d.name}</Text>
                <Text className="text-sm text-muted-foreground">Director</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  if (sectionKey === 'compilation-report') {
    return (
      <View>
        <PaperHeading title="Compilation report" />
        <Paragraph>
          We have compiled the accompanying financial statements of {legal} based on information
          provided by the directors. These comprise the statement of financial position as at{' '}
          {yearEnd}, and the related statements for the year then ended.
        </Paragraph>
        <Paragraph>
          We performed this compilation in accordance with SSRS 4410 (Revised), Compilation
          Engagements. We have not audited or reviewed these financial statements.
        </Paragraph>
        {fs.compilationSigner ? (
          <Text className="pt-4 text-sm text-foreground">{fs.compilationSigner}</Text>
        ) : (
          <Text className="pt-4 text-sm text-warning-text">
            Compilation report signer not added
          </Text>
        )}
      </View>
    );
  }

  if (sectionKey === 'changes-in-equity') {
    const rows: Row[] = [
      {
        kind: 'line',
        label: `Balance at 1 April ${Number(report.period.end.slice(0, 4)) - 1}`,
        cells: [100000, -21952, 78048],
      },
      { kind: 'line', label: 'Profit for the year', cells: [null, 48210, 48210] },
      { kind: 'total', label: `Balance at ${yearEnd}`, cells: [100000, 26258, 126258] },
    ];
    return (
      <View>
        <PaperHeading
          title="Statement of changes in equity"
          subtitle={`For the year ended ${yearEnd}`}
        />
        <StatementTable
          columns={[
            { label: '', flex: 1 },
            { label: 'Share capital', align: 'right' },
            { label: 'Retained earnings', align: 'right' },
            { label: 'Total', align: 'right' },
          ]}
          rows={rows}
          dropLastCell={false}
        />
      </View>
    );
  }

  if (sectionKey === 'notes') {
    const policies = fs.policies.filter((p) => p.on);
    return (
      <View>
        <PaperHeading
          title="Notes to the financial statements"
          subtitle={`For the year ended ${yearEnd}`}
        />
        <NoteHeading>1. General information</NoteHeading>
        <Paragraph>
          {legal} (UEN {fs.entity.uen}) is incorporated in Singapore. Its registered office is at{' '}
          {fs.entity.office}. Its principal activity is{' '}
          {fs.entity.activity.replace(/^\d+\s/, '').toLowerCase()}.
        </Paragraph>
        <NoteHeading>2. Basis of preparation</NoteHeading>
        <Paragraph>
          These financial statements are prepared in accordance with the {fs.framework} and{' '}
          {STANDARD_LABEL[fs.standard]}
          {fs.historicalCost ? ', under the historical cost convention' : ''}
          {fs.goingConcern ? ', on a going concern basis' : ''}. Amounts are in {fs.currency}.
        </Paragraph>
        <NoteHeading>3. Significant accounting policies</NoteHeading>
        {policies.map((p, i) => (
          <View key={p.key}>
            <Text className="pb-1 font-plex-semibold text-sm text-foreground">
              3.{i + 1} {p.title}
            </Text>
            <Paragraph>{p.text}</Paragraph>
          </View>
        ))}
        <NoteHeading>4. Related party transactions</NoteHeading>
        {fs.relatedParties.length === 0 ? (
          <Paragraph>
            There were no significant related party transactions during the year.
          </Paragraph>
        ) : (
          fs.relatedParties.map((r) => (
            <Paragraph key={r.id}>
              {r.party} ({r.relationship.toLowerCase()}): {r.transaction}. {r.terms}.
            </Paragraph>
          ))
        )}
      </View>
    );
  }

  // Statements — the financial statements' titles map onto the matching reports.
  const FS_REPORT: Record<string, string> = {
    'financial-position': 'balance-sheet',
    'comprehensive-income': 'profit-and-loss',
    'cash-flows': 'cash-flow',
  };
  const key = FS_REPORT[sectionKey] ?? sectionKey;
  const title = FS_CONTENTS.find((c) => c.key === sectionKey)?.name ?? reportName(key);
  const detail =
    key === 'general-ledger'
      ? buildLedgerDetail(DEFAULT_LEDGER_ACCOUNT, DEFAULT_PERIOD)
      : REPORT_DETAILS[key];
  if (!detail) return null;
  // Snapshot reports (balance sheet, aged lists…) are "as at" the period end, not a range.
  const asAt = ALL_REPORTS.find((r) => r.key === key)?.periodKind === 'asAt';
  if (report.type === 'ma' && asAt) columns = asAtColumns(report.period, shape, compare);
  const withCompare = !!detail.comparable && columns.length > 1;
  return (
    <View>
      <PaperHeading
        title={title}
        subtitle={
          report.type === 'fs'
            ? asAt
              ? `As at ${yearEnd}`
              : `For the year ended ${yearEnd}`
            : asAt
              ? asAtLabel(report.period)
              : shapeLabel(report.period, shape)
        }
      />
      <StatementTable
        columns={detail.comparable && !withCompare ? detail.columns.slice(0, -1) : detail.columns}
        rows={detail.rows}
        dropLastCell={!!detail.comparable && !withCompare}
        resolveLabel={(label) =>
          label.replace('{PRIOR_FY}', columns[1] ?? '').replace('{FY}', columns[0])
        }
      />
    </View>
  );
}

function NoteHeading({ children }: { children: React.ReactNode }) {
  return <Text className="pb-2 pt-2 font-plex-semibold text-base text-foreground">{children}</Text>;
}

// ---------------------------------------------------------------------------------------------
// Dialogs
// ---------------------------------------------------------------------------------------------

function PublishDialog({
  open,
  onOpenChange,
  onReview,
  onPublish,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReview: () => void;
  onPublish: () => void;
}) {
  const openChecks = ['1 bank account to reconcile', '2 customers over 60 days'];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publish with open checks?</DialogTitle>
          <DialogDescription>Publishing locks the figures in this report.</DialogDescription>
        </DialogHeader>
        <View className="gap-2 rounded-lg border border-border p-4">
          {openChecks.map((c) => (
            <View key={c} className="flex-row items-center gap-2">
              <Icon as={CircleAlert} size={16} className="text-warning" />
              <Text className="text-sm text-foreground">{c}</Text>
            </View>
          ))}
        </View>
        <DialogFooter>
          <Button variant="outline" onPress={onReview}>
            <Text>Review in Work Queue</Text>
          </Button>
          <Button onPress={onPublish}>
            <Text>Publish anyway</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SendDialog({
  open,
  onOpenChange,
  report,
  company,
  templates,
  fileName,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ClientReport;
  company: Company;
  templates: Templates;
  fileName: string;
  onSend: (recipientName: string) => void;
}) {
  const [name, setName] = React.useState(templates.ma.recipientName);
  const [email, setEmail] = React.useState(templates.ma.recipientEmail);
  const [subject, setSubject] = React.useState(`${clientReportName(report)}, ${company.name}`);
  const firstName = templates.ma.recipientName.split(/[ ,]/)[0];
  const [message, setMessage] = React.useState(
    `Hi ${firstName},\n\nAttached are the management accounts for ${periodLabel(report.period)}. Let us know if you have any questions.`
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send to client</DialogTitle>
        </DialogHeader>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <DialogField label="Name">
              <Input value={name} onChangeText={setName} accessibilityLabel="Recipient name" />
            </DialogField>
          </View>
          <View className="flex-1">
            <DialogField label="Email">
              <Input
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel="Recipient email"
              />
            </DialogField>
          </View>
        </View>
        <DialogField label="Subject">
          <Input value={subject} onChangeText={setSubject} accessibilityLabel="Subject" />
        </DialogField>
        <DialogField label="Message">
          <Input
            multiline
            value={message}
            onChangeText={setMessage}
            accessibilityLabel="Message"
            style={{ minHeight: 120, textAlignVertical: 'top' }}
            className="h-auto py-3 sm:h-auto"
          />
        </DialogField>
        <View className="flex-row items-center gap-2 rounded-lg bg-muted px-3 py-2.5">
          <Icon as={FileText} size={16} className="text-muted-foreground" />
          <Text className="shrink text-sm text-foreground" numberOfLines={1}>
            {fileName}
          </Text>
        </View>
        <DialogFooter>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            <Text>Cancel</Text>
          </Button>
          <Button disabled={!email.trim()} onPress={() => onSend(name.trim())}>
            <Icon as={Send} size={16} />
            <Text>Send</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SignatureDialog({
  open,
  onOpenChange,
  signers,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signers: string[];
  onSend: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send for signature</DialogTitle>
          <DialogDescription>
            Sending locks the figures in these financial statements.
          </DialogDescription>
        </DialogHeader>
        <View className="gap-2 rounded-lg border border-border p-4">
          {signers.map((s) => (
            <View key={s} className="flex-row items-center gap-2">
              <Icon as={Send} size={14} className="text-muted-foreground" />
              <Text className="text-sm text-foreground">{s}</Text>
            </View>
          ))}
        </View>
        <DialogFooter>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            <Text>Cancel</Text>
          </Button>
          <Button onPress={onSend}>
            <Text>Send for signature</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
