import { Flex, Stack, Switch, Text } from "@sanity/ui";
import { useId, useRef, useState } from "react";
import { useClient, useEditState, useFormValue, type ImageInputProps } from "sanity";

import { homepageDocumentId, homepagePhotoIdentity } from "../content/homepage";

type GalleryPhoto = {
  _key?: string;
  alt?: string;
  asset?: { _ref?: string };
};

type HomepageGridPhoto = {
  _key: string;
  photoId?: string;
  wedding?: { _ref?: string };
  photoKey?: string;
  asset?: { _ref?: string };
  image?: { asset?: { _ref?: string } };
};

type HomepageDraft = {
  _rev: string;
  gridPhotos?: HomepageGridPhoto[];
};

const draftId = `drafts.${homepageDocumentId}`;
const clientOptions = { apiVersion: "2025-02-19", useCdn: false };

type WeddingPhoto = { weddingId: string; photoKey: string; assetRef: string; alt: string };

function getGridPhotos(homepage: HomepageDraft | null | undefined): HomepageGridPhoto[] {
  return homepage?.gridPhotos ?? [];
}

function linksToWedding(photo: HomepageGridPhoto, { weddingId, photoKey }: WeddingPhoto) {
  return photo.wedding?._ref === weddingId && photo.photoKey === photoKey;
}

function matchesWeddingPhoto(weddingPhoto: WeddingPhoto) {
  const identity = homepagePhotoIdentity(undefined, weddingPhoto.assetRef);
  return (photo: HomepageGridPhoto) => linksToWedding(photo, weddingPhoto) ||
    homepagePhotoIdentity(photo.photoId, photo.asset?._ref ?? photo.image?.asset?._ref) === identity;
}

async function setWeddingPhotoOnHomepage(client: ReturnType<typeof useClient>, weddingPhoto: WeddingPhoto, enabled: boolean) {
  const { weddingId, photoKey, assetRef, alt } = weddingPhoto;
  const matches = matchesWeddingPhoto(weddingPhoto);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const [draft, published] = await client.getDocuments<HomepageDraft>([draftId, homepageDocumentId]);
    const photos = getGridPhotos(draft ?? published);
    const existing = photos.filter(matches);
    const first = existing[0];
    if (!enabled && !first) return;
    if (enabled && existing.length === 1 && linksToWedding(first, weddingPhoto)) return;

    const gridPhotos = photos.filter((photo) => !matches(photo) || (enabled && photo === first));
    if (enabled) {
      const entry = {
        _key: first?._key ?? Array.from(crypto.getRandomValues(new Uint8Array(12)), (byte) => byte.toString(16).padStart(2, "0")).join(""),
        _type: "homepageWeddingPhoto",
        wedding: { _type: "reference", _ref: weddingId, _weak: true },
        photoKey,
        image: { _type: "image", asset: { _type: "reference", _ref: assetRef }, alt },
      };
      if (first) gridPhotos[gridPhotos.indexOf(first)] = entry;
      else gridPhotos.push(entry);
    }

    try {
      if (draft) {
        await client.patch(draftId).ifRevisionId(draft._rev)
          .set({ gridPhotos })
          .commit();
        return;
      }

      if (!published) {
        await client.create({
          _id: draftId,
          _type: homepageDocumentId,
          gridPhotos,
        });
        return;
      }

      await client.action({
        actionType: "sanity.action.document.version.create",
        publishedId: homepageDocumentId,
        baseId: homepageDocumentId,
        versionId: draftId,
        ifBaseRevisionId: published._rev,
      });
    } catch (error) {
      const status = (error as { statusCode?: number } | null)?.statusCode;
      if (status !== 404 && status !== 409) throw error;
    }
  }

  throw new Error("The Homepage draft changed while this photograph was being updated.");
}

function HomepagePhotoSwitch({ photo }: { photo: WeddingPhoto }) {
  const client = useClient(clientOptions);
  const { draft, published, ready } = useEditState(homepageDocumentId, homepageDocumentId);
  const id = useId();
  const submitting = useRef(false);
  const [pending, setPending] = useState<boolean>();
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState<{ revision: string | undefined; enabled: boolean }>();
  const homepage = draft ?? published;
  const revision = homepage?._rev;
  const included = ready && getGridPhotos(homepage).some(matchesWeddingPhoto(photo));
  const awaitingSync = saved && saved.revision === revision && saved.enabled !== included;

  if (saved && !awaitingSync) setSaved(undefined);
  const checked = pending ?? (awaitingSync ? saved.enabled : included);
  let description = "Show this photo below the sphere.";
  if (!ready) description = "Checking the Homepage selection…";
  else if (pending !== undefined) description = "Updating the Homepage draft…";
  else if (failed) description = "Could not update the Homepage draft. Try again.";
  else if (checked) description = draft || awaitingSync ? "Added to the Homepage draft." : "Already on the Homepage.";

  async function updateSelection(enabled: boolean) {
    if (!ready || submitting.current) return;
    submitting.current = true;
    setPending(enabled);
    setFailed(false);

    try {
      await setWeddingPhotoOnHomepage(client, photo, enabled);
      setSaved({ revision, enabled });
    } catch (error) {
      console.error("Could not update the wedding photograph on Homepage", error);
      setFailed(true);
    } finally {
      submitting.current = false;
      setPending(undefined);
    }
  }

  return (
    <Flex align="center" justify="space-between" gap={3} marginTop={3}>
      <Stack gap={2}>
        <Text as="label" htmlFor={id} size={1} weight="medium">Add to homepage</Text>
        <Text id={`${id}-description`} role="status" size={1} style={{ color: "var(--card-muted-fg-color)" }}>
          {description}
        </Text>
      </Stack>
      <Switch
        id={id}
        role="switch"
        aria-describedby={`${id}-description`}
        checked={checked}
        disabled={!ready || pending !== undefined}
        onChange={(event) => void updateSelection(event.currentTarget.checked)}
      />
    </Flex>
  );
}

export function GalleryPhotoInput(props: ImageInputProps) {
  const documentId = useFormValue(["_id"]);
  const { _key: photoKey, asset, alt } = (props.value ?? {}) as GalleryPhoto;
  const assetRef = asset?._ref;
  const weddingId = typeof documentId === "string"
    ? documentId.replace(/^(?:drafts\.|versions\.[^.]+\.)/, "")
    : undefined;

  return (
    <>
      {props.renderDefault(props)}
      {weddingId && photoKey && assetRef && !props.readOnly && (
        <HomepagePhotoSwitch key={`${weddingId}:${photoKey}:${assetRef}`} photo={{ weddingId, photoKey, assetRef, alt: alt ?? "" }} />
      )}
    </>
  );
}
