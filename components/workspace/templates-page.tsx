import { Button } from '@/components/ui/button';
import { Checkbox, CheckboxField } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { SortableList } from '@/components/ui/sortable-list';
import { moveItem } from '@/components/workspace/client-report-builder';
import {
  activeDirectors,
  coerceCompare,
  compareOptions,
  CONTENT_NAMES,
  defaultTemplates,
  DEMO_TODAY,
  fileNameFor,
  FILE_NAME_TOKENS,
  formatDate,
  NOTIFY_ROLES,
  PRACTICE_SIGNERS,
  requiredSigners,
  signingDirectors,
  STANDARD_LABEL,
  templateIssues,
  type Frequency,
  type FsTemplate,
  type Issue,
  type MaTemplate,
  type TemplatePage,
  type Templates,
} from '@/components/workspace/client-report-data';
import {
  PanelBackLink,
  PanelNavItem,
  PanelNavSection,
  TwoPanel,
} from '@/components/workspace/panel-nav';
import type { Company } from '@/lib/companies';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Plus,
  RefreshCw,
  Trash2,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

const PAGES: { section: string; pages: { key: TemplatePage; label: string }[] }[] = [
  {
    section: 'Management accounts',
    pages: [
      { key: 'ma-general', label: 'General' },
      { key: 'ma-reports', label: 'Reports included' },
      { key: 'ma-display', label: 'Display' },
    ],
  },
  {
    section: 'Financial statements',
    pages: [
      { key: 'fs-entity', label: 'Entity details' },
      { key: 'fs-directors', label: 'Directors' },
      { key: 'fs-notes', label: 'Notes and policies' },
      { key: 'fs-related', label: 'Related parties' },
      { key: 'fs-compliance', label: 'Compliance' },
    ],
  },
];

const ISSUE_ICON: Record<Issue, { icon: LucideIcon; className: string; label: string }> = {
  error: { icon: TriangleAlert, className: 'text-destructive-text', label: 'Needs fixing' },
  warning: { icon: CircleAlert, className: 'text-warning', label: 'Needs a look' },
};

export function TemplatesPage({
  company,
  templates,
  onChange,
  page,
  onPageChange,
  returnTo,
  firstRun,
  dirty,
  onSave,
  onDiscard,
}: {
  company: Company;
  templates: Templates;
  onChange: (templates: Templates) => void;
  page: TemplatePage;
  onPageChange: (page: TemplatePage) => void;
  /** Set when a readiness check's fix link opened Templates — the way back to that report. */
  returnTo: { label: string; onPress: () => void } | null;
  firstRun: boolean;
  dirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const issues = templateIssues(templates.fs);
  const setMa = (patch: Partial<MaTemplate>) =>
    onChange({ ...templates, ma: { ...templates.ma, ...patch } });
  const setFs = (patch: Partial<FsTemplate>) =>
    onChange({ ...templates, fs: { ...templates.fs, ...patch } });
  const pageLabel = PAGES.flatMap((s) => s.pages).find((p) => p.key === page)!.label;
  const isMa = page.startsWith('ma-');

  return (
    <TwoPanel
      mobileNav="stacked"
      nav={
        <>
          {returnTo && <PanelBackLink label={returnTo.label} onPress={returnTo.onPress} />}
          {PAGES.map((section, i) => (
            <PanelNavSection key={section.section} label={section.section} first={i === 0}>
              {section.pages.map((p) => {
                const issue = issues[p.key];
                return (
                  <PanelNavItem
                    key={p.key}
                    label={p.label}
                    active={p.key === page}
                    onPress={() => onPageChange(p.key)}
                    trailing={
                      issue ? (
                        <Icon
                          as={ISSUE_ICON[issue].icon}
                          size={16}
                          accessibilityLabel={ISSUE_ICON[issue].label}
                          className={ISSUE_ICON[issue].className}
                        />
                      ) : undefined
                    }
                  />
                );
              })}
            </PanelNavSection>
          ))}
        </>
      }>
      <View className="gap-10 p-6 md:p-8" style={{ maxWidth: 820 }}>
        <View className="gap-1">
          <Text variant="h3">{pageLabel}</Text>
          <Text className="text-base text-muted-foreground">
            {isMa ? 'Management accounts' : 'Financial statements'} template for {company.name}
          </Text>
        </View>
        {page === 'ma-general' && (
          <MaGeneral ma={templates.ma} company={company} onChange={setMa} />
        )}
        {page === 'ma-reports' && <MaReports ma={templates.ma} onChange={setMa} />}
        {page === 'ma-display' && <MaDisplay ma={templates.ma} onChange={setMa} />}
        {page === 'fs-entity' && <FsEntity fs={templates.fs} company={company} onChange={setFs} />}
        {page === 'fs-directors' && <FsDirectors fs={templates.fs} onChange={setFs} />}
        {page === 'fs-notes' && <FsNotes fs={templates.fs} onChange={setFs} />}
        {page === 'fs-related' && <FsRelated fs={templates.fs} onChange={setFs} />}
        {page === 'fs-compliance' && <FsCompliance fs={templates.fs} onChange={setFs} />}
      </View>

      {(dirty || firstRun) && (
        <View
          style={{ position: 'sticky', bottom: 0, zIndex: 5 } as ViewStyle}
          className="flex-row items-center justify-between gap-4 border-t border-border bg-white px-6 py-4 md:rounded-br-3xl md:px-8">
          <Text className="shrink text-sm text-muted-foreground">
            {firstRun ? 'Save to start creating client reports' : 'Unsaved changes'}
          </Text>
          <View className="flex-row items-center gap-2">
            {!firstRun && (
              <Button variant="outline" onPress={onDiscard}>
                <Text>Discard</Text>
              </Button>
            )}
            <Button onPress={onSave}>
              <Text>{firstRun ? 'Save templates' : 'Save changes'}</Text>
            </Button>
          </View>
        </View>
      )}
    </TwoPanel>
  );
}

// ---------------------------------------------------------------------------------------------
// Form pieces
// ---------------------------------------------------------------------------------------------

/** A titled group of settings, separated from the one above by a hairline. The heading sits
 * close to its own fields (not midway between them and the divider), and the fields get more
 * room between each other than a label gets from its control. */
function FormSection({
  title,
  description,
  first,
  children,
}: {
  title?: string;
  description?: string;
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View className={cn(!first && 'border-t border-border pt-8')}>
      {title && (
        <View className="gap-1 pb-4">
          <Text className="font-plex-semibold text-lg leading-tight text-foreground">{title}</Text>
          {description && <Text className="text-sm text-muted-foreground">{description}</Text>}
        </View>
      )}
      <View className="gap-6">{children}</View>
    </View>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={cn('gap-2', className)}>
      <Text className="font-plex-semibold text-sm text-foreground">{label}</Text>
      {children}
    </View>
  );
}

function FormSelect({
  label,
  value,
  options,
  onValueChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <Select
      value={current ? { value: current.value, label: current.label } : undefined}
      onValueChange={(o) => o && onValueChange(o.value)}>
      <SelectTrigger aria-label={label} className={cn('w-full', className)}>
        <Text className={cn('text-sm', current ? 'text-foreground' : 'text-muted-foreground')}>
          {current?.label ?? placeholder}
        </Text>
      </SelectTrigger>
      <SelectContent align="start" className="w-72">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} label={o.label} />
        ))}
      </SelectContent>
    </Select>
  );
}

function IssueNote({ issue, children }: { issue: Issue; children: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <Icon as={ISSUE_ICON[issue].icon} size={16} className={ISSUE_ICON[issue].className} />
      <Text
        className={cn(
          'shrink text-sm',
          issue === 'error' ? 'text-destructive-text' : 'text-warning-text'
        )}>
        {children}
      </Text>
    </View>
  );
}

/** A bordered list with a row per item. */
function ListBox({ children }: { children: React.ReactNode }) {
  return <View className="overflow-hidden rounded-xl border border-border">{children}</View>;
}

function ListRow({ first, children }: { first: boolean; children: React.ReactNode }) {
  return (
    <View
      className={cn('flex-row items-center gap-3 px-4 py-2.5', !first && 'border-t border-border')}>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Management accounts
// ---------------------------------------------------------------------------------------------

function MaGeneral({
  ma,
  company,
  onChange,
}: {
  ma: MaTemplate;
  company: Company;
  onChange: (patch: Partial<MaTemplate>) => void;
}) {
  const compare = compareOptions(ma.frequency);
  const preview = fileNameFor(ma.fileName, ma.capitals, {
    created: DEMO_TODAY,
    entity: company.name,
    type: 'ma',
    period: { frequency: ma.frequency, end: '2027-03' },
  });
  return (
    <>
      <FormSection
        first
        title="File name"
        description="Used for management accounts and financial statements.">
        <View className="gap-3">
          <Input
            value={ma.fileName}
            onChangeText={(fileName) => onChange({ fileName })}
            accessibilityLabel="File name pattern"
          />
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-sm text-muted-foreground">Insert</Text>
            {FILE_NAME_TOKENS.map((token) => (
              <Button
                key={token}
                variant="outline"
                size="sm"
                onPress={() =>
                  onChange({
                    fileName: ma.fileName.trim()
                      ? `${ma.fileName.trim()} - {${token}}`
                      : `{${token}}`,
                  })
                }>
                <Text className="font-plex-regular text-brand">{token}</Text>
              </Button>
            ))}
          </View>
        </View>
        <View className="gap-1 rounded-lg bg-muted px-4 py-3">
          <Text className="text-sm text-muted-foreground">Preview</Text>
          <Text className="text-sm text-foreground">{preview}</Text>
        </View>
        <CheckboxField
          label="Use capital letters"
          checked={ma.capitals}
          onCheckedChange={(capitals) => onChange({ capitals })}
        />
      </FormSection>

      <FormSection title="Period">
        <Field label="How often">
          <SegmentedControl
            variant="track"
            value={ma.frequency}
            onValueChange={(v) => {
              const frequency = v as Frequency;
              onChange({ frequency, compareWith: coerceCompare(frequency, ma.compareWith) });
            }}
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'quarterly', label: 'Quarterly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
          />
        </Field>
        <Field label="Compare with">
          <View className="flex-row flex-wrap items-center gap-3">
            <View style={{ width: 260 }}>
              <FormSelect
                label="Compare with"
                value={ma.compareWith}
                options={compare}
                onValueChange={(v) => onChange({ compareWith: v as MaTemplate['compareWith'] })}
              />
            </View>
            {ma.compareWith !== 'none' && (
              <View style={{ width: 140 }}>
                <FormSelect
                  label="Comparative periods"
                  value={String(ma.comparePeriods)}
                  options={[1, 2, 3].map((n) => ({
                    value: String(n),
                    label: `${n} period${n > 1 ? 's' : ''}`,
                  }))}
                  onValueChange={(v) => onChange({ comparePeriods: Number(v) })}
                />
              </View>
            )}
          </View>
        </Field>
        {ma.frequency !== 'yearly' && (
          <CheckboxField
            label="Add a year-to-date column"
            checked={ma.yearToDate}
            onCheckedChange={(yearToDate) => onChange({ yearToDate })}
          />
        )}
      </FormSection>

      <FormSection title="Automation">
        <CheckboxField
          label="Create a draft automatically after each period ends"
          checked={ma.autoDraft}
          onCheckedChange={(autoDraft) => onChange({ autoDraft })}
        />
        {ma.autoDraft && (
          <View className="flex-row flex-wrap items-center gap-3">
            <Text className="text-sm text-foreground">Create it</Text>
            <Input
              value={ma.autoDays}
              onChangeText={(t) => onChange({ autoDays: t.replace(/\D/g, '').slice(0, 2) })}
              keyboardType="number-pad"
              accessibilityLabel="Days after the period ends"
              style={{ width: 64 }}
              className="text-center"
            />
            <Text className="text-sm text-foreground">days after the period ends, and notify</Text>
            <View style={{ width: 200 }}>
              <FormSelect
                label="Notify"
                value={ma.notifyRole}
                options={NOTIFY_ROLES.map((r) => ({ value: r, label: r }))}
                onValueChange={(notifyRole) => onChange({ notifyRole })}
              />
            </View>
          </View>
        )}
      </FormSection>

      <FormSection title="Recipient">
        <View className="gap-4 md:flex-row">
          <Field label="Name" className="flex-1">
            <Input
              value={ma.recipientName}
              onChangeText={(recipientName) => onChange({ recipientName })}
              accessibilityLabel="Recipient name"
            />
          </Field>
          <Field label="Email" className="flex-1">
            <Input
              value={ma.recipientEmail}
              onChangeText={(recipientEmail) => onChange({ recipientEmail })}
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Recipient email"
            />
          </Field>
        </View>
      </FormSection>
    </>
  );
}

function MaReports({
  ma,
  onChange,
}: {
  ma: MaTemplate;
  onChange: (patch: Partial<MaTemplate>) => void;
}) {
  return (
    <ListBox>
      <SortableList
        items={ma.contents}
        keyOf={(item) => item.key}
        labelOf={(item) => CONTENT_NAMES[item.key]}
        onMove={(from, to) => onChange({ contents: moveItem(ma.contents, from, to) })}
        renderItem={(item, i, handle) => {
          const name = CONTENT_NAMES[item.key];
          return (
            <ListRow first={i === 0}>
              <Pressable
                onPress={() =>
                  onChange({
                    contents: ma.contents.map((c) =>
                      c.key === item.key ? { ...c, included: !c.included } : c
                    ),
                  })
                }
                role="checkbox"
                aria-checked={item.included}
                className="min-w-0 flex-1 flex-row items-center gap-3 py-1 web:cursor-pointer">
                <Checkbox checked={item.included} tone="primary" size="sm" />
                <Text
                  className={cn(
                    'text-base',
                    item.included ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                  {name}
                </Text>
              </Pressable>
              {handle}
            </ListRow>
          );
        }}
      />
    </ListBox>
  );
}

function MaDisplay({
  ma,
  onChange,
}: {
  ma: MaTemplate;
  onChange: (patch: Partial<MaTemplate>) => void;
}) {
  return (
    <FormSection first>
      <CheckboxField
        label="Show account codes"
        checked={ma.showCodes}
        onCheckedChange={(showCodes) => onChange({ showCodes })}
      />
      <CheckboxField
        label="Hide accounts with no balance"
        checked={ma.hideZero}
        onCheckedChange={(hideZero) => onChange({ hideZero })}
      />
      <Field label="Amounts">
        <SegmentedControl
          variant="track"
          value={ma.amounts}
          onValueChange={(v) => onChange({ amounts: v as MaTemplate['amounts'] })}
          options={[
            { value: 'whole', label: 'Whole dollars' },
            { value: 'cents', label: 'Cents' },
          ]}
        />
      </Field>
      <Field label="Default export">
        <SegmentedControl
          variant="track"
          value={ma.exportFormat}
          onValueChange={(v) => onChange({ exportFormat: v as MaTemplate['exportFormat'] })}
          options={[
            { value: 'pdf', label: 'PDF' },
            { value: 'excel', label: 'Excel' },
          ]}
        />
      </Field>
    </FormSection>
  );
}

// ---------------------------------------------------------------------------------------------
// Financial statements
// ---------------------------------------------------------------------------------------------

const ENTITY_FIELDS: { key: keyof FsTemplate['entity']; label: string }[] = [
  { key: 'legalName', label: 'Legal name' },
  { key: 'uen', label: 'UEN' },
  { key: 'office', label: 'Registered office' },
  { key: 'activity', label: 'Principal activity (SSIC)' },
  { key: 'incorporated', label: 'Incorporated' },
  { key: 'yearEnd', label: 'Financial year end' },
];

function FsEntity({
  fs,
  company,
  onChange,
}: {
  fs: FsTemplate;
  company: Company;
  onChange: (patch: Partial<FsTemplate>) => void;
}) {
  return (
    <>
      <FormSection first>
        <View className="flex-row flex-wrap items-center justify-between gap-3">
          <View className="flex-row items-center gap-2">
            <Icon as={RefreshCw} size={14} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground">
              {fs.entityOverridden
                ? 'Edited here, not synced from ACRA'
                : `Synced from ACRA BizFile on ${formatDate(DEMO_TODAY)}`}
            </Text>
          </View>
          {fs.entityOverridden ? (
            <Button
              variant="outline"
              size="sm"
              onPress={() =>
                onChange({ entity: defaultTemplates(company).fs.entity, entityOverridden: false })
              }>
              <Text>Use ACRA details</Text>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onPress={() => onChange({ entityOverridden: true })}>
              <Text>Edit details</Text>
            </Button>
          )}
        </View>
        <View className="gap-4">
          {ENTITY_FIELDS.map((f) =>
            fs.entityOverridden ? (
              <Field key={f.key} label={f.label}>
                <Input
                  value={fs.entity[f.key]}
                  onChangeText={(v) => onChange({ entity: { ...fs.entity, [f.key]: v } })}
                  accessibilityLabel={f.label}
                />
              </Field>
            ) : (
              <View key={f.key} className="gap-1 md:flex-row md:gap-4">
                <Text style={{ width: 220 }} className="text-sm text-muted-foreground">
                  {f.label}
                </Text>
                <Text className="flex-1 text-sm text-foreground">{fs.entity[f.key]}</Text>
              </View>
            )
          )}
        </View>
      </FormSection>

      <FormSection title="Signing">
        <Field label="Accountant signing the compilation report">
          <View className="gap-2">
            <View style={{ maxWidth: 360 }}>
              <FormSelect
                label="Accountant signing the compilation report"
                value={fs.compilationSigner}
                placeholder="Choose an accountant"
                options={PRACTICE_SIGNERS.map((s) => ({ value: s, label: s }))}
                onValueChange={(compilationSigner) => onChange({ compilationSigner })}
              />
            </View>
            {!fs.compilationSigner && (
              <IssueNote issue="warning">Needed for the compilation report</IssueNote>
            )}
          </View>
        </Field>
        <View className="gap-4 md:flex-row">
          <Field label="Signing date" className="flex-1">
            <Input
              value={fs.signingDate}
              onChangeText={(signingDate) => onChange({ signingDate })}
              placeholder="Same day as the directors"
              accessibilityLabel="Signing date"
            />
          </Field>
          <Field label="Reporting currency" className="flex-1">
            <FormSelect
              label="Reporting currency"
              value={fs.currency}
              options={[
                { value: 'SGD', label: 'SGD, Singapore dollar' },
                { value: 'USD', label: 'USD, US dollar' },
              ]}
              onValueChange={(currency) => onChange({ currency })}
            />
          </Field>
        </View>
      </FormSection>

      <FormSection title="This year">
        <CheckboxField
          label="First financial year"
          checked={fs.firstYear}
          onCheckedChange={(firstYear) => onChange({ firstYear })}
        />
        <CheckboxField
          label="GST registered"
          checked={fs.gstRegistered}
          onCheckedChange={(gstRegistered) => onChange({ gstRegistered })}
        />
        <CheckboxField
          label="Dividends paid or declared"
          checked={fs.dividends}
          onCheckedChange={(dividends) => onChange({ dividends })}
        />
      </FormSection>
    </>
  );
}

function FsDirectors({
  fs,
  onChange,
}: {
  fs: FsTemplate;
  onChange: (patch: Partial<FsTemplate>) => void;
}) {
  const required = requiredSigners(fs);
  const chosen = signingDirectors(fs).length;
  const setDirector = (id: string, patch: Partial<FsTemplate['directors'][number]>) =>
    onChange({ directors: fs.directors.map((d) => (d.id === id ? { ...d, ...patch } : d)) });

  return (
    <FormSection first>
      <View className="flex-row items-center gap-2">
        <Icon as={RefreshCw} size={14} className="text-muted-foreground" />
        <Text className="text-sm text-muted-foreground">
          Synced from ACRA BizFile on {formatDate(DEMO_TODAY)}
        </Text>
      </View>
      <ListBox>
        <View className="flex-row items-center gap-3 bg-muted px-4 py-2.5">
          <Text className="flex-1 font-plex-semibold text-sm text-muted-foreground">Name</Text>
          <Text
            style={{ width: 120 }}
            className="hidden font-plex-semibold text-sm text-muted-foreground md:flex">
            Appointed
          </Text>
          <Text
            style={{ width: 120 }}
            className="hidden font-plex-semibold text-sm text-muted-foreground md:flex">
            Resigned
          </Text>
          <Text style={{ width: 90 }} className="font-plex-semibold text-sm text-muted-foreground">
            Signs
          </Text>
        </View>
        {fs.directors.map((d) => (
          <View key={d.id} className="flex-row items-center gap-3 border-t border-border px-4 py-3">
            <View className="min-w-0 flex-1">
              {d.manual ? (
                <Input
                  value={d.name}
                  onChangeText={(name) => setDirector(d.id, { name })}
                  placeholder="Director's full name"
                  accessibilityLabel="Director name"
                />
              ) : (
                <Text
                  className={cn(
                    'text-base',
                    d.resigned ? 'text-muted-foreground' : 'text-foreground'
                  )}>
                  {d.name}
                </Text>
              )}
            </View>
            <Text style={{ width: 120 }} className="hidden text-sm text-muted-foreground md:flex">
              {d.appointed}
            </Text>
            <Text style={{ width: 120 }} className="hidden text-sm text-muted-foreground md:flex">
              {d.resigned ?? '–'}
            </Text>
            <View style={{ width: 90 }} className="flex-row items-center gap-2">
              <Pressable
                onPress={() => setDirector(d.id, { signs: !d.signs })}
                disabled={!!d.resigned}
                role="checkbox"
                aria-checked={d.signs}
                accessibilityLabel={`${d.name} signs`}
                className={cn('web:cursor-pointer', d.resigned && 'opacity-40')}>
                <Checkbox checked={d.signs} tone="primary" size="sm" />
              </Pressable>
              {d.manual && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-7 sm:w-7"
                  accessibilityLabel="Remove director"
                  onPress={() =>
                    onChange({ directors: fs.directors.filter((x) => x.id !== d.id) })
                  }>
                  <Icon as={Trash2} size={14} className="text-muted-foreground" />
                </Button>
              )}
            </View>
          </View>
        ))}
      </ListBox>
      {chosen < required && (
        <IssueNote issue="error">
          {required === 2
            ? `Choose 2 directors to sign. Companies with more than one director need two signatures.`
            : 'Choose the director who signs.'}
        </IssueNote>
      )}
      <Button
        variant="outline"
        className="self-start"
        onPress={() =>
          onChange({
            directors: [
              ...fs.directors,
              {
                id: `manual-${Date.now()}`,
                name: '',
                appointed: formatDate(DEMO_TODAY),
                signs: false,
                manual: true,
              },
            ],
          })
        }>
        <Icon as={Plus} size={16} />
        <Text>Add director</Text>
      </Button>
      {activeDirectors(fs).length === 0 && (
        <Text className="text-sm text-muted-foreground">No current directors.</Text>
      )}
    </FormSection>
  );
}

function FsNotes({
  fs,
  onChange,
}: {
  fs: FsTemplate;
  onChange: (patch: Partial<FsTemplate>) => void;
}) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const setPolicy = (key: string, patch: Partial<FsTemplate['policies'][number]>) =>
    onChange({ policies: fs.policies.map((p) => (p.key === key ? { ...p, ...patch } : p)) });
  const toggleExpanded = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <>
      <FormSection first title="Accounting policies">
        <ListBox>
          <SortableList
            items={fs.policies}
            keyOf={(p) => p.key}
            labelOf={(p) => p.title || 'Untitled policy'}
            onMove={(from, to) => onChange({ policies: moveItem(fs.policies, from, to) })}
            renderItem={(p, i, handle) => {
              const open = expanded.has(p.key);
              const warn = !p.on && p.warnIfOff;
              return (
                <View className={cn(i > 0 && 'border-t border-border')}>
                  <View className="flex-row items-center gap-3 px-4 py-2.5">
                    <Pressable
                      onPress={() => setPolicy(p.key, { on: !p.on })}
                      role="checkbox"
                      aria-checked={p.on}
                      accessibilityLabel={`Include ${p.title}`}
                      hitSlop={6}
                      className="web:cursor-pointer">
                      <Checkbox checked={p.on} tone="primary" size="sm" />
                    </Pressable>
                    <Pressable
                      onPress={() => toggleExpanded(p.key)}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: open }}
                      className="min-w-0 flex-1 flex-row flex-wrap items-center gap-x-3 gap-y-1 py-1 web:cursor-pointer">
                      <Icon
                        as={open ? ChevronDown : ChevronRight}
                        size={14}
                        className="text-muted-foreground"
                      />
                      <Text
                        className={cn(
                          'text-base',
                          p.on ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                        {p.title || 'Untitled policy'}
                      </Text>
                      {warn ? (
                        <IssueNote issue="warning">{p.warnIfOff!}</IssueNote>
                      ) : !p.on && p.offReason ? (
                        <Text className="text-sm text-muted-foreground">{p.offReason}</Text>
                      ) : null}
                    </Pressable>
                    {handle}
                  </View>
                  {open && (
                    <View className="gap-3 px-4 pb-4" style={{ paddingLeft: 46 }}>
                      {p.key.startsWith('custom-') && (
                        <Input
                          value={p.title}
                          onChangeText={(title) => setPolicy(p.key, { title })}
                          placeholder="Policy title"
                          accessibilityLabel="Policy title"
                        />
                      )}
                      <Input
                        multiline
                        value={p.text}
                        onChangeText={(text) => setPolicy(p.key, { text })}
                        placeholder="Policy wording"
                        accessibilityLabel={`${p.title} wording`}
                        style={{ minHeight: 96, textAlignVertical: 'top' }}
                        className="h-auto py-3 leading-6 sm:h-auto"
                      />
                    </View>
                  )}
                </View>
              );
            }}
          />
        </ListBox>
        <Button
          variant="outline"
          className="self-start"
          onPress={() => {
            const key = `custom-${Date.now()}`;
            onChange({ policies: [...fs.policies, { key, title: '', text: '', on: true }] });
            setExpanded((prev) => new Set(prev).add(key));
          }}>
          <Icon as={Plus} size={16} />
          <Text>Add custom policy</Text>
        </Button>
      </FormSection>

      <FormSection title="Statements">
        <Field label="Statement detail">
          <SegmentedControl
            variant="track"
            value={fs.statementDetail}
            onValueChange={(v) => onChange({ statementDetail: v as FsTemplate['statementDetail'] })}
            options={[
              { value: 'summary', label: 'Summary lines' },
              { value: 'every', label: 'Every account' },
            ]}
          />
        </Field>
      </FormSection>
    </>
  );
}

const PARTY_FIELDS: {
  key: 'party' | 'relationship' | 'transaction' | 'terms';
  label: string;
  flex: number;
}[] = [
  { key: 'party', label: 'Party', flex: 1 },
  { key: 'relationship', label: 'Relationship', flex: 0.8 },
  { key: 'transaction', label: 'Transaction', flex: 1.4 },
  { key: 'terms', label: 'Terms', flex: 1.2 },
];

function FsRelated({
  fs,
  onChange,
}: {
  fs: FsTemplate;
  onChange: (patch: Partial<FsTemplate>) => void;
}) {
  const setParty = (id: string, patch: Partial<FsTemplate['relatedParties'][number]>) =>
    onChange({
      relatedParties: fs.relatedParties.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });

  return (
    <FormSection first>
      {fs.suggestedParties.map((s) => (
        <View
          key={s.id}
          className="gap-3 rounded-xl border border-border bg-muted px-4 py-3 md:flex-row md:items-center">
          <View className="min-w-0 flex-1 gap-0.5">
            <Text className="text-sm text-muted-foreground">Suggested from the ledger</Text>
            <Text className="text-base text-foreground">
              {s.party}, {s.relationship.toLowerCase()} · {s.transaction}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Button
              variant="ghost"
              size="sm"
              onPress={() =>
                onChange({ suggestedParties: fs.suggestedParties.filter((x) => x.id !== s.id) })
              }>
              <Text>Dismiss</Text>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() =>
                onChange({
                  relatedParties: [...fs.relatedParties, s],
                  suggestedParties: fs.suggestedParties.filter((x) => x.id !== s.id),
                })
              }>
              <Icon as={Plus} size={14} />
              <Text>Add</Text>
            </Button>
          </View>
        </View>
      ))}

      <ListBox>
        <View className="hidden flex-row items-center gap-3 bg-muted px-4 py-2.5 md:flex">
          {PARTY_FIELDS.map((f) => (
            <Text
              key={f.key}
              style={{ flex: f.flex }}
              className="font-plex-semibold text-sm text-muted-foreground">
              {f.label}
            </Text>
          ))}
          <View style={{ width: 28 }} />
        </View>
        {fs.relatedParties.length === 0 ? (
          <Text className="px-4 py-6 text-center text-sm text-muted-foreground">
            No related parties
          </Text>
        ) : (
          fs.relatedParties.map((r) => (
            <View
              key={r.id}
              className="gap-2 border-t border-border px-4 py-3 md:flex-row md:items-center md:gap-3">
              {PARTY_FIELDS.map((f) => (
                <View key={f.key} style={{ flex: f.flex }} className="min-w-0">
                  <Input
                    value={r[f.key]}
                    onChangeText={(v) => setParty(r.id, { [f.key]: v })}
                    placeholder={f.label}
                    accessibilityLabel={f.label}
                  />
                </View>
              ))}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 self-end sm:h-7 sm:w-7 md:self-center"
                accessibilityLabel="Remove related party"
                onPress={() =>
                  onChange({ relatedParties: fs.relatedParties.filter((x) => x.id !== r.id) })
                }>
                <Icon as={Trash2} size={14} className="text-muted-foreground" />
              </Button>
            </View>
          ))
        )}
      </ListBox>
      <Button
        variant="outline"
        className="self-start"
        onPress={() =>
          onChange({
            relatedParties: [
              ...fs.relatedParties,
              {
                id: `party-${Date.now()}`,
                party: '',
                relationship: '',
                transaction: '',
                terms: '',
              },
            ],
          })
        }>
        <Icon as={Plus} size={16} />
        <Text>Add related party</Text>
      </Button>
    </FormSection>
  );
}

function FsCompliance({
  fs,
  onChange,
}: {
  fs: FsTemplate;
  onChange: (patch: Partial<FsTemplate>) => void;
}) {
  return (
    <>
      <FormSection first title="Framework">
        <View className="gap-4 md:flex-row">
          <Field label="Law" className="flex-1">
            <FormSelect
              label="Law"
              value={fs.framework}
              options={[{ value: 'Companies Act 1967', label: 'Companies Act 1967' }]}
              onValueChange={(framework) => onChange({ framework })}
            />
          </Field>
          <Field label="Accounting standard" className="flex-1">
            <FormSelect
              label="Accounting standard"
              value={fs.standard}
              options={(Object.keys(STANDARD_LABEL) as FsTemplate['standard'][]).map((k) => ({
                value: k,
                label: STANDARD_LABEL[k],
              }))}
              onValueChange={(v) => onChange({ standard: v as FsTemplate['standard'] })}
            />
          </Field>
        </View>
        <CheckboxField
          label="Exempt from audit as a small company"
          checked={fs.auditExempt}
          onCheckedChange={(auditExempt) => onChange({ auditExempt })}
        />
      </FormSection>
      <FormSection title="Assumptions">
        <CheckboxField
          label="Going concern"
          checked={fs.goingConcern}
          onCheckedChange={(goingConcern) => onChange({ goingConcern })}
        />
        <CheckboxField
          label="Historical cost"
          checked={fs.historicalCost}
          onCheckedChange={(historicalCost) => onChange({ historicalCost })}
        />
      </FormSection>
    </>
  );
}
