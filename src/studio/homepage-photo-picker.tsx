import { AddIcon } from "@sanity/icons/Add";
import { CheckmarkIcon } from "@sanity/icons/Checkmark";
import { Box, Button, Card, Dialog, Flex, Grid, Spinner, Stack, Text } from "@sanity/ui";
import { createContext, useContext, useEffect, useId, useState, type ComponentProps } from "react";
import { insert, PatchEvent, set, setIfMissing, useClient, type ArrayOfObjectsInputProps, type PreviewProps } from "sanity";

import { homepagePhotoIdentity, legacyHomepagePhotoHashes, spherePhotoCount } from "../content/homepage";
import { SelectablePhotoArray } from "./photo-array-selection";

const clientOptions = { apiVersion: "2025-02-19", useCdn: false };
const assetQuery = `*[_type == "sanity.imageAsset" && defined(url)] | order(_createdAt desc, _id asc) {
  _id, url, altText, originalFilename
}`;

type HomepagePhotoValue = {
  _key: string;
  _type?: string;
  photoId?: string;
  asset?: { _ref?: string };
  image?: { asset?: { _ref?: string } };
};

type LibraryPhoto = { _id: string; url: string; altText?: string; originalFilename?: string };
type PhotoChoice = { id: string; assetId: string; title: string; thumbnail: string; alt?: string };
type PhotoActionsProps = ComponentProps<NonNullable<ArrayOfObjectsInputProps["arrayFunctions"]>>;

const LegacyPhotoAssets = createContext<ReadonlyMap<string, LibraryPhoto>>(new Map());

function createPhotoKey() {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function homepagePhoto(assetId: string, alt: string | undefined, _key: string) {
  return { _key, _type: "homepagePhoto", asset: { _type: "reference", _ref: assetId }, alt: alt ?? "" };
}

function photoIdentity(photo: HomepagePhotoValue) {
  return homepagePhotoIdentity(photo.photoId, photo.asset?._ref ?? photo.image?.asset?._ref);
}

function assetThumbnail(src: string) {
  const url = new URL(src);
  url.search = "w=320&h=320&fit=max&auto=format";
  return url.href;
}

function makeChoices(assets: LibraryPhoto[]) {
  const choices = new Map<string, PhotoChoice>();
  for (const asset of assets) {
    const id = homepagePhotoIdentity(undefined, asset._id) ?? asset._id;
    if (choices.has(id)) continue;

    choices.set(id, {
      id,
      title: asset.altText || asset.originalFilename || "Sanity photograph",
      thumbnail: assetThumbnail(asset.url),
      assetId: asset._id,
      alt: asset.altText,
    });
  }
  return [...choices.values()];
}

function PhotoChoices({ choices, chosen, present, atLimit, onChoose }: {
  choices: PhotoChoice[];
  chosen: ReadonlySet<string>;
  present: ReadonlySet<string | undefined>;
  atLimit?: boolean;
  onChoose: (photo: PhotoChoice) => void;
}) {
  return (
    <Grid gap={2} style={{ gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))" }} role="group" aria-label="Available photos">
      {choices.map((photo) => {
        const selected = chosen.has(photo.id);
        const alreadyPresent = present.has(photo.id);

        return (
          <Button
            key={photo.id}
            type="button"
            mode={selected ? "default" : "ghost"}
            tone={selected ? "primary" : "default"}
            padding={1}
            aria-label={alreadyPresent ? `${photo.title} (already in this list)` : photo.title}
            aria-pressed={selected}
            title={alreadyPresent ? "Already in this list" : undefined}
            disabled={alreadyPresent || (atLimit && !selected)}
            onClick={() => onChoose(photo)}
          >
            <Box style={{ position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- Sanity Studio renders outside Next.js. */}
              <img
                src={photo.thumbnail}
                alt=""
                loading="lazy"
                decoding="async"
                style={{ display: "block", width: "100%", aspectRatio: 1, objectFit: "contain" }}
              />
              {(selected || alreadyPresent) && (
                <Card radius={2} padding={1} style={{ position: "absolute", insetBlockEnd: 4, insetInlineEnd: 4 }}>
                  <Text size={1}><CheckmarkIcon /></Text>
                </Card>
              )}
            </Box>
          </Button>
        );
      })}
    </Grid>
  );
}

function HomepagePhotoDialog({ value, limit, onClose, onAdd }: {
  value: readonly HomepagePhotoValue[];
  limit: number;
  onClose: () => void;
  onAdd: (photos: HomepagePhotoValue[]) => void;
}) {
  const id = useId();
  const client = useClient(clientOptions);
  const [library, setLibrary] = useState<LibraryPhoto[] | "error" | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [chosen, setChosen] = useState(new Map<string, PhotoChoice>());
  const present = new Set(value.map(photoIdentity));
  const pending = [...chosen.values()].filter((photo) => !present.has(photo.id));

  useEffect(() => {
    const controller = new AbortController();
    client.fetch<LibraryPhoto[]>(assetQuery, {}, { signal: controller.signal }).then((photos) => {
      if (!controller.signal.aborted) setLibrary(photos);
    }).catch(() => {
      if (!controller.signal.aborted) setLibrary("error");
    });
    return () => controller.abort();
  }, [attempt, client]);

  function toggle(photo: PhotoChoice) {
    setChosen((previous) => {
      const next = new Map(previous);
      if (next.has(photo.id)) next.delete(photo.id);
      else next.set(photo.id, photo);
      return next;
    });
  }

  function addPhotos() {
    if (!pending.length || pending.length > limit) return;

    onAdd(pending.map((photo) => {
      return homepagePhoto(photo.assetId, photo.alt, createPhotoKey());
    }));
  }

  return (
    <Dialog
      id={id}
      width={2}
      header="Choose existing photos"
      onClose={onClose}
      footer={(
        <Flex justify="flex-end" gap={2} padding={3}>
          <Button type="button" mode="bleed" text="Cancel" onClick={onClose} />
          <Button
            type="button"
            tone="primary"
            icon={AddIcon}
            text={pending.length ? `Add selected (${pending.length})` : "Add selected"}
            disabled={!pending.length || pending.length > limit}
            onClick={addPhotos}
          />
        </Flex>
      )}
    >
      <Stack gap={3}>
        {Number.isFinite(limit) && (
          <Text size={1} muted role="status">{limit === 1 ? "1 spot left in the sphere" : `${limit} spots left in the sphere`}</Text>
        )}
        <PhotoChoices
          choices={makeChoices(Array.isArray(library) ? library : [])}
          chosen={new Set(pending.map((photo) => photo.id))}
          present={present}
          atLimit={pending.length >= limit}
          onChoose={toggle}
        />
        {library === null && (
          <Flex align="center" gap={2} role="status"><Spinner /><Text size={1}>Loading Sanity photos…</Text></Flex>
        )}
        {library === "error" && (
          <Flex align="center" gap={2} wrap="wrap" role="status">
            <Text size={1}>Could not load Sanity photos.</Text>
            <Button type="button" mode="ghost" text="Retry" onClick={() => {
              setLibrary(null);
              setAttempt((count) => count + 1);
            }} />
          </Flex>
        )}
      </Stack>
    </Dialog>
  );
}

function HomepagePhotoActions(props: PhotoActionsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const value = (props.value ?? []) as HomepagePhotoValue[];
  const legacyAssets = useContext(LegacyPhotoAssets);
  const legacyPhotos = value.filter((photo) => photo._type === "homepageBuiltInPhoto");
  const limit = props.path.at(-1) === "spherePhotos" ? Math.max(0, spherePhotoCount - value.length) : Infinity;
  const canConvert = legacyPhotos.every((photo) => legacyAssets.has(photoIdentity(photo) ?? ""));

  function convertPhotos() {
    const changes = legacyPhotos.flatMap((photo) => {
      const asset = legacyAssets.get(photoIdentity(photo) ?? "");
      return asset ? [set(homepagePhoto(asset._id, asset.altText, photo._key), [{ _key: photo._key }])] : [];
    });
    if (changes.length === legacyPhotos.length && changes.length) props.onChange(PatchEvent.from(changes));
  }

  if (props.readOnly) return null;

  return (
    <Stack gap={2}>
      <Flex gap={2} wrap="wrap">
        <Button type="button" mode="ghost" text="Choose existing photos" icon={AddIcon} disabled={!limit} onClick={() => setPickerOpen(true)} />
        <Button type="button" mode="ghost" text="Add new photo" disabled={!limit}
          onClick={() => props.onItemAppend({ _key: createPhotoKey(), _type: "homepagePhoto" } as HomepagePhotoValue)} />
        {legacyPhotos.length > 0 && (
          <Button type="button" mode="ghost" text="Convert to Sanity photo links" disabled={!canConvert} onClick={convertPhotos} />
        )}
        {props.children}
      </Flex>
      {pickerOpen && (
        <HomepagePhotoDialog value={value} limit={limit} onClose={() => setPickerOpen(false)} onAdd={(items) => {
          props.onChange(PatchEvent.from([setIfMissing([]), insert(items, "after", [-1])]));
          setPickerOpen(false);
        }} />
      )}
    </Stack>
  );
}

export function HomepagePhotoArray(props: ArrayOfObjectsInputProps) {
  const client = useClient(clientOptions);
  const hasLegacyPhotos = (props.value as HomepagePhotoValue[] | undefined)?.some((photo) => photo._type === "homepageBuiltInPhoto");
  const [assets, setAssets] = useState<ReadonlyMap<string, LibraryPhoto>>(new Map());
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!hasLegacyPhotos) return;
    const controller = new AbortController();
    client.fetch<(LibraryPhoto & { sha1hash: string })[]>(
      '*[_type == "sanity.imageAsset" && sha1hash in $hashes && defined(url)]{_id, url, sha1hash, altText, originalFilename}',
      { hashes: legacyHomepagePhotoHashes },
      { signal: controller.signal },
    ).then((photos) => {
      if (!controller.signal.aborted) {
        setAssets(new Map(photos.map((asset) => [asset.sha1hash, asset])));
        setLoadFailed(false);
      }
    }).catch(() => {
      if (!controller.signal.aborted) setLoadFailed(true);
    });
    return () => controller.abort();
  }, [client, hasLegacyPhotos]);

  return (
    <LegacyPhotoAssets.Provider value={assets}>
      <SelectablePhotoArray {...props} arrayFunctions={HomepagePhotoActions} />
      {hasLegacyPhotos && loadFailed && <Text size={1} muted role="status">Could not load the Sanity photos. Reload the form to try again.</Text>}
    </LegacyPhotoAssets.Provider>
  );
}

export function LegacyHomepagePhotoPreview(props: PreviewProps) {
  const assets = useContext(LegacyPhotoAssets);
  const hash = typeof props.title === "string" ? homepagePhotoIdentity(props.title) : undefined;
  const asset = hash ? assets.get(hash) : undefined;
  const media = asset && <span style={{ display: "block", width: "100%", height: "100%", background: `center / cover no-repeat url("${assetThumbnail(asset.url)}")` }} />;

  return props.renderDefault({
    ...props,
    title: asset?.altText || asset?.originalFilename || "Original photo",
    media,
  });
}
