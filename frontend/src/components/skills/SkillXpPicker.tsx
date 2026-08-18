import { memo, useEffect, useMemo, useRef } from "react";
import {
  Box,
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  UnstyledButton,
  VisuallyHidden,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type {
  SkillCatalog,
  SkillCatalogEntry,
  SkillProgression,
} from "@/features/skills/types";
import type {
  SkillXpChoice,
  SkillXpSelectionController,
} from "@/features/skills/useSkillXpSelection";
import classes from "./SkillXpPicker.module.css";

interface SelectedSkillProps {
  choice: SkillXpChoice;
  formatCompactNumber: (value: number) => string;
  formatNumber: (value: number) => string;
  onCustomAmountChange: (skillId: string, amount: number | null) => void;
  onRemove: (skillId: string) => void;
  onSetMode: (skillId: string, mode: SkillXpChoice["mode"]) => void;
  onToggleLevel: (skillId: string, level: number) => void;
  progression: SkillProgression;
  skill: SkillCatalogEntry;
}

const SelectedSkill = memo(function SelectedSkill({
  choice,
  formatCompactNumber,
  formatNumber,
  onCustomAmountChange,
  onRemove,
  onSetMode,
  onToggleLevel,
  progression,
  skill,
}: SelectedSkillProps) {
  const { t } = useTranslation("players");
  const total =
    choice.mode === "custom"
      ? (choice.amount ?? 0)
      : progression.levels.reduce(
          (sum, level) =>
            choice.levels.has(level.level) ? sum + level.xp : sum,
          0,
        );

  return (
    <Box className={classes.selectedSkill}>
      <Group justify="space-between" mb={6} wrap="nowrap">
        <Group gap="xs" wrap="nowrap" miw={0}>
          <img alt="" className={classes.skillIcon} src={skill.image} />
          <Text className={classes.skillName} fw={500} size="sm">
            {skill.name}
          </Text>
        </Group>
        <Group gap={4} wrap="nowrap">
          <Text c="dimmed" size="xs" style={{ whiteSpace: "nowrap" }}>
            {t("addXpDialog.skillTotal", { amount: formatNumber(total) })}
          </Text>
          <ActionIcon
            aria-label={t("addXpDialog.removeSkill", { skill: skill.name })}
            color="gray"
            onClick={() => onRemove(skill.id)}
            size="sm"
            variant="subtle"
          >
            <IconX aria-hidden="true" size={14} />
          </ActionIcon>
        </Group>
      </Group>

      {choice.mode === "custom" ? (
        <Group align="flex-end" gap="sm" justify="space-between" wrap="nowrap">
          <NumberInput
            allowDecimal={false}
            allowNegative={false}
            aria-label={t("addXpDialog.customXpAccessibleLabel", {
              skill: skill.name,
            })}
            hideControls
            max={Number.MAX_SAFE_INTEGER}
            min={1}
            onChange={(value) =>
              onCustomAmountChange(
                skill.id,
                typeof value === "number" &&
                  Number.isInteger(value) &&
                  value > 0
                  ? value
                  : null,
              )
            }
            placeholder={t("addXpDialog.customXpPlaceholder")}
            size="xs"
            value={choice.amount ?? ""}
            w={180}
          />
          <Switch
            checked
            label={t("addXpDialog.customXp")}
            onChange={() => onSetMode(skill.id, "levels")}
            size="xs"
          />
        </Group>
      ) : (
        <Group
          align="flex-end"
          component="fieldset"
          gap={4}
          m={0}
          p={0}
          style={{ border: 0 }}
        >
          <VisuallyHidden component="legend">{skill.name}</VisuallyHidden>
          {progression.levels.map((level) => {
            const selected = choice.levels.has(level.level);
            return (
              <Button
                aria-label={t("addXpDialog.levelAccessibleLabel", {
                  amount: formatNumber(level.xp),
                  level: level.level,
                  skill: skill.name,
                })}
                aria-pressed={selected}
                className={classes.levelButton}
                data-selected={selected || undefined}
                h={36}
                key={level.level}
                onClick={() => onToggleLevel(skill.id, level.level)}
                px={6}
                size="compact-xs"
                variant={selected ? "filled" : "default"}
              >
                <Stack align="center" gap={0}>
                  <Text className={classes.levelLabel} fz={9} lh={1}>
                    {t("addXpDialog.levelShort", { level: level.level })}
                  </Text>
                  <Text fz="xs" lh={1.2}>
                    +{formatCompactNumber(level.xp)}
                  </Text>
                </Stack>
              </Button>
            );
          })}
          <Switch
            checked={false}
            label={t("addXpDialog.customXp")}
            ml="auto"
            onChange={() => onSetMode(skill.id, "custom")}
            size="xs"
          />
        </Group>
      )}
    </Box>
  );
});

interface SkillXpPickerProps {
  catalog: SkillCatalog;
  selection: SkillXpSelectionController;
}

export function SkillXpPicker({ catalog, selection }: SkillXpPickerProps) {
  const { t } = useTranslation("players");
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(catalog.language),
    [catalog.language],
  );
  const compactNumberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(catalog.language, {
        maximumFractionDigits: 1,
        notation: "compact",
      }),
    [catalog.language],
  );
  const formatNumber = useMemo(
    () => (value: number) => numberFormatter.format(value),
    [numberFormatter],
  );
  const formatCompactNumber = useMemo(
    () => (value: number) => compactNumberFormatter.format(value),
    [compactNumberFormatter],
  );
  const selectedSkills = Array.from(selection.selection.keys()).flatMap(
    (skillId) => {
      const skill = catalog.skillsById.get(skillId);
      return skill ? [skill] : [];
    },
  );
  const selectedScrollRegionRef = useRef<HTMLDivElement>(null);
  const wasSelectedAtBottom = useRef(true);
  const previousSelectedCount = useRef(selectedSkills.length);

  useEffect(() => {
    const skillAdded = selectedSkills.length > previousSelectedCount.current;
    previousSelectedCount.current = selectedSkills.length;
    if (!skillAdded || !wasSelectedAtBottom.current) return;

    const scrollRegion = selectedScrollRegionRef.current;
    scrollRegion?.scrollTo({
      behavior: "smooth",
      top: scrollRegion.scrollHeight,
    });
  }, [selectedSkills.length]);

  return (
    <Box className={classes.picker}>
      <Paper className={classes.pane} component={Stack} gap={0} withBorder>
        <Text fw={600} px="sm" py="xs" size="sm">
          {t("addXpDialog.skillsHeading")}
        </Text>
        <ScrollArea
          className={classes.scrollRegion}
          offsetScrollbars="y"
          scrollbarSize={10}
          scrollbars="y"
          type="auto"
        >
          <Stack gap="sm" p="xs">
            {catalog.categories.map((category) => (
              <Box key={category.id}>
                <Text c="dimmed" fw={600} mb={3} px={5} size="xs">
                  {category.name}
                </Text>
                <SimpleGrid cols={2} spacing={2} verticalSpacing={2}>
                  {category.skills.map((skill) => {
                    const selected = selection.selection.has(skill.id);
                    return (
                      <UnstyledButton
                        aria-pressed={selected}
                        className={classes.skillButton}
                        data-selected={selected || undefined}
                        key={skill.id}
                        onClick={() => selection.toggleSkill(skill.id)}
                      >
                        <img
                          alt=""
                          className={classes.skillIcon}
                          src={skill.image}
                        />
                        <Text className={classes.skillName} fw={500} size="xs">
                          {skill.name}
                        </Text>
                      </UnstyledButton>
                    );
                  })}
                </SimpleGrid>
              </Box>
            ))}
          </Stack>
        </ScrollArea>
      </Paper>

      <Paper className={classes.pane} component={Stack} gap={0} withBorder>
        <Group justify="space-between" px="sm" py="xs">
          <Text fw={600} size="sm">
            {t("addXpDialog.selectedHeading", {
              count: selectedSkills.length,
            })}
          </Text>
          <Button
            color="gray"
            disabled={selectedSkills.length === 0}
            onClick={selection.clear}
            size="compact-xs"
            variant="subtle"
          >
            {t("addXpDialog.clear")}
          </Button>
        </Group>

        <ScrollArea
          className={classes.scrollRegion}
          offsetScrollbars="y"
          onScrollPositionChange={() => {
            const region = selectedScrollRegionRef.current;
            if (region) {
              wasSelectedAtBottom.current =
                region.scrollHeight - region.scrollTop - region.clientHeight <=
                1;
            }
          }}
          overscrollBehavior="contain"
          scrollbarSize={10}
          scrollbars="y"
          type="auto"
          viewportRef={selectedScrollRegionRef}
        >
          {selectedSkills.length > 0 ? (
            selectedSkills.map((skill) => {
              const progression = catalog.progressions.get(skill.progressionId);
              const choice = selection.selection.get(skill.id);
              if (!progression || !choice) return null;

              return (
                <SelectedSkill
                  choice={choice}
                  formatCompactNumber={formatCompactNumber}
                  formatNumber={formatNumber}
                  key={skill.id}
                  onCustomAmountChange={selection.setCustomAmount}
                  onRemove={selection.remove}
                  onSetMode={selection.setMode}
                  onToggleLevel={selection.toggleLevel}
                  progression={progression}
                  skill={skill}
                />
              );
            })
          ) : (
            <Text c="dimmed" p="xl" size="sm" ta="center">
              {t("addXpDialog.emptySelection")}
            </Text>
          )}
        </ScrollArea>
      </Paper>
    </Box>
  );
}
