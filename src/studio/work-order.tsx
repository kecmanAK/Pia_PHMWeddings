import { AddIcon } from "@sanity/icons/Add";
import { DragHandleIcon } from "@sanity/icons/DragHandle";
import { ImageIcon } from "@sanity/icons/Image";
import { Box, Button, Card, Flex, Spinner, Stack, Text } from "@sanity/ui";
import { Reorder, useDragControls, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { defineArrayMember, defineField, defineType, set, useDocumentStore, type ArrayOfPrimitivesInputProps } from "sanity";
import { IntentLink } from "sanity/router";
import { usePaneRouter } from "sanity/structure";

import { orderWorkGalleries, workOrderDocumentId } from "../content/work-order";
import { interactionDuration } from "../lib/motion";

type Gallery = { _id: string; names?: string; thumbnail?: string | null };

const galleryQuery = {
  fetch: `*[_type == "wedding" && !(_id in path("versions.**"))] | order(_createdAt asc, _id asc) {
    _id, names, "thumbnail": coalesce(photos[highlight == true][0].asset->url, photos[0].asset->url)
  }`,
  listen: '*[_type == "wedding" && !(_id in path("versions.**"))]',
};

function GalleryLink({ gallery }: { gallery: Gallery }) {
  const { ChildLink } = usePaneRouter();
  const name = gallery.names?.trim() || "Untitled gallery";
  const thumbnail = gallery.thumbnail && new URL("?w=96&h=96&fit=crop&auto=format", gallery.thumbnail).href;

  return (
    <Button
      as={ChildLink}
      childId={gallery._id.replace(/^drafts\./, "")}
      mode="bleed"
      width="fill"
      padding={2}
      justify="flex-start"
      aria-label={`Edit ${name}`}
    >
      <Flex align="center" gap={3}>
        <Card
          radius={2}
          aria-hidden
          style={{ width: 40, height: 40, display: "grid", placeItems: "center", background: thumbnail ? `center / cover url("${thumbnail}")` : undefined }}
        >
          {!thumbnail && <Text size={2} muted><ImageIcon /></Text>}
        </Card>
        <Text size={1} weight="medium">{name}</Text>
      </Flex>
    </Button>
  );
}

function SortableGallery({ gallery, disabled, onDragStart, onDragEnd }: {
  gallery: Gallery;
  disabled: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const controls = useDragControls();
  const reducedMotion = useReducedMotion();
  const name = gallery.names?.trim() || "Untitled gallery";

  return (
    <Reorder.Item
      value={gallery._id}
      dragListener={false}
      drag={disabled ? false : "y"}
      dragControls={controls}
      layout="position"
      transition={{ layout: { duration: reducedMotion ? 0 : interactionDuration } }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      aria-label={name}
      {...(disabled ? { tabIndex: -1 } : {})}
      style={{ position: "relative", marginBottom: 4 }}
    >
      <Card border radius={2}>
        <Flex align="center">
          {!disabled && (
            <Box
              padding={3}
              aria-hidden
              style={{ cursor: "grab", touchAction: "none" }}
              onPointerDown={(event) => controls.start(event)}
            >
              <Text size={2} muted><DragHandleIcon /></Text>
            </Box>
          )}
          <Box flex={1} style={{ minWidth: 0 }}><GalleryLink gallery={gallery} /></Box>
        </Flex>
      </Card>
    </Reorder.Item>
  );
}

function WorkOrderInput(props: ArrayOfPrimitivesInputProps) {
  const store = useDocumentStore();
  const [galleries, setGalleries] = useState<Gallery[] | "error">();
  const [attempt, setAttempt] = useState(0);
  const [preview, setPreview] = useState<string[]>();
  const dragOrder = useRef<string[] | undefined>(undefined);

  useEffect(() => {
    const subscription = store.listenQuery(galleryQuery, {}, { apiVersion: "2025-02-19", perspective: "raw" }).subscribe({
      next: (documents: Gallery[]) => setGalleries(documents),
      error: () => setGalleries("error"),
    });
    return () => subscription.unsubscribe();
  }, [attempt, store]);

  const documents = Array.isArray(galleries) ? galleries : [];
  const published = documents.filter(({ _id }) => !_id.startsWith("drafts."));
  const publishedIds = new Set(published.map(({ _id }) => _id));
  const drafts = documents.filter(({ _id }) => _id.startsWith("drafts.") && !publishedIds.has(_id.slice(7)));
  const savedOrder = props.value?.filter((id) => typeof id === "string");
  const ordered = orderWorkGalleries(published, preview ?? savedOrder, (gallery) => gallery._id);
  const ids = ordered.map(({ _id }) => _id);
  const canReorder = !props.readOnly && ids.length > 1;

  function saveOrder(next: string[]) {
    if (!canReorder) return;
    const currentOrder = orderWorkGalleries(published, savedOrder, (gallery) => gallery._id).map(({ _id }) => _id);
    const nextOrder = orderWorkGalleries(published, next, (gallery) => gallery._id).map(({ _id }) => _id);
    if (nextOrder.some((id, index) => id !== currentOrder[index])) props.onChange(set(nextOrder));
  }

  return (
    <Stack gap={4} {...props.elementProps} tabIndex={-1}>
      <Flex>
        <Button as={IntentLink} intent="create" params={{ type: "wedding", template: "wedding" }}
          icon={AddIcon} text="New gallery" mode="ghost" />
      </Flex>
      {galleries === undefined && (
        <Flex align="center" gap={2} role="status"><Spinner /><Text size={1}>Loading galleries…</Text></Flex>
      )}
      {galleries === "error" && (
        <Flex align="center" gap={2} wrap="wrap" role="status">
          <Text size={1}>Could not load the galleries.</Text>
          <Button type="button" mode="ghost" text="Retry" onClick={() => {
            setGalleries(undefined);
            setAttempt((count) => count + 1);
          }} />
        </Flex>
      )}
      {Array.isArray(galleries) && (
        <>
          {ids.length ? (
            <Reorder.Group as="ol" axis="y" values={ids} aria-label="Published galleries"
              style={{ listStyle: "none", padding: 0, margin: 0 }}
              onReorder={(next) => {
                if (!canReorder) return;
                if (dragOrder.current) {
                  dragOrder.current = next;
                  setPreview(next);
                } else saveOrder(next);
              }}
            >
              {ordered.map((gallery) => (
                <SortableGallery key={gallery._id} gallery={gallery} disabled={!canReorder}
                  onDragStart={() => { dragOrder.current = ids; }}
                  onDragEnd={() => {
                    const next = dragOrder.current;
                    dragOrder.current = undefined;
                    setPreview(undefined);
                    if (next) saveOrder(next);
                  }}
                />
              ))}
            </Reorder.Group>
          ) : <Text size={1} muted>No published galleries yet.</Text>}
          {drafts.length > 0 && (
            <Stack gap={2}>
              <Text as="h3" size={1} weight="medium">Unpublished galleries</Text>
              {drafts.map((gallery) => <Card key={gallery._id} border radius={2}><GalleryLink gallery={gallery} /></Card>)}
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}

export const workOrderSchema = defineType({
  name: workOrderDocumentId,
  title: "Work order",
  type: "document",
  preview: { prepare: () => ({ title: "Work order" }) },
  fields: [
    defineField({
      name: "weddingIds",
      title: "Gallery order",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      components: { input: WorkOrderInput },
      description: "Drag the published galleries into order, then publish. New galleries appear at the end.",
      validation: (rule) => rule.unique(),
    }),
  ],
});
