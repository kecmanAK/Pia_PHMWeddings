import { CheckmarkIcon } from "@sanity/icons/Checkmark";
import { CloseIcon } from "@sanity/icons/Close";
import { SelectIcon } from "@sanity/icons/Select";
import { SquareIcon } from "@sanity/icons/Square";
import { TrashIcon } from "@sanity/icons/Trash";
import { Box, Button, Flex, Stack } from "@sanity/ui";
import { createContext, useContext, useState } from "react";
import { PatchEvent, unset, type ArrayOfObjectsInputProps, type ItemProps } from "sanity";

const PhotoSelection = createContext<{
  selected: ReadonlySet<string>;
  toggle: (key: string) => void;
} | null>(null);

export function SelectablePhotoArray(props: ArrayOfObjectsInputProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const keys = (props.value ?? []).map(({ _key }) => _key);
  const selectedKeys = keys.filter((key) => selected.has(key));
  const hasSelection = selectedKeys.length > 0;

  function toggle(key: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function deleteSelected() {
    if (props.readOnly || !hasSelection) return;
    props.onChange(PatchEvent.from(selectedKeys.map((_key) => unset([{ _key }]))));
    setSelected(new Set());
  }

  if (props.readOnly) return props.renderDefault(props);

  return (
    <PhotoSelection.Provider value={{ selected, toggle }}>
      <Stack gap={2}>
        <Flex role="group" aria-label="Photo selection" gap={2} wrap="wrap">
          <Button
            type="button"
            mode="bleed"
            fontSize={1}
            padding={2}
            icon={SelectIcon}
            text="Select all"
            disabled={selectedKeys.length === keys.length}
            onClick={() => setSelected(new Set(keys))}
          />
          <Button
            type="button"
            mode="bleed"
            tone="critical"
            fontSize={1}
            padding={2}
            icon={TrashIcon}
            text={hasSelection ? `Delete selected (${selectedKeys.length})` : "Delete selected"}
            disabled={!hasSelection}
            onClick={deleteSelected}
          />
          <Button
            type="button"
            mode="bleed"
            fontSize={1}
            padding={2}
            icon={CloseIcon}
            text="Deselect"
            disabled={!hasSelection}
            onClick={() => setSelected(new Set())}
          />
        </Flex>
        {props.renderDefault(props)}
      </Stack>
    </PhotoSelection.Provider>
  );
}

export function SelectablePhotoItem(props: ItemProps) {
  const selection = useContext(PhotoSelection);
  const item = props.path.at(-1);
  if (!selection || props.readOnly || !item || typeof item !== "object" || !("_key" in item)) {
    return props.renderDefault(props);
  }

  const { _key } = item;
  const isSelected = selection.selected.has(_key);

  return (
    <Flex align="center" gap={1}>
      <Button
        type="button"
        mode={isSelected ? "default" : "bleed"}
        tone={isSelected ? "primary" : "default"}
        fontSize={1}
        padding={2}
        icon={isSelected ? CheckmarkIcon : SquareIcon}
        aria-label={`Select photo ${props.index + 1}`}
        aria-pressed={isSelected}
        onClick={() => selection.toggle(_key)}
      />
      <Box flex={1} style={{ minWidth: 0 }}>{props.renderDefault(props)}</Box>
    </Flex>
  );
}
