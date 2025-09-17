import * as React from "react";
import { useTranslation } from "react-i18next";

import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import {
  DrawerTabContent,
  DrawerTabContentSection,
  RepositoryDetails,
} from "@app/components/detail-drawer";
import { SchemaDefinedField } from "@app/components/schema-defined-fields";
import { useFetchApplicationManifest } from "@app/queries/applications";
import { useFetchPlatformById } from "@app/queries/platforms";
import { useFetchPlatformCoordinatesSchema } from "@app/queries/schemas";

import { DecoratedApplication } from "../useDecoratedApplications";

/**
 * Show the platform awareness and asset generation details for the application.
 */
export const TabPlatformContent: React.FC<{
  application: DecoratedApplication;
}> = ({ application }) => {
  const { t } = useTranslation();
  const { manifest } = useFetchApplicationManifest(
    (application.manifests?.length ?? 0) > 0 ? application.id : undefined
  );
  const { platform } = useFetchPlatformById(application.platform?.id);
  const { coordinatesSchema } = useFetchPlatformCoordinatesSchema(
    platform?.kind
  );

  return (
    <DrawerTabContent>
      <DrawerTabContentSection label={t("terms.sourcePlatform")}>
        {application.platform?.name || <EmptyTextMessage />}
        {/* TODO: Do we need to add the platform details here? */}
      </DrawerTabContentSection>

      <DrawerTabContentSection label={t("terms.sourcePlatformCoordinates")}>
        {application.coordinates && coordinatesSchema ? (
          <SchemaDefinedField
            isReadOnly
            jsonDocument={application.coordinates?.content}
            jsonSchema={coordinatesSchema?.definition}
          />
        ) : (
          <EmptyTextMessage />
        )}
      </DrawerTabContentSection>

      <DrawerTabContentSection label={t("terms.assetRepository")}>
        {application.assets ? (
          // TODO: Align this with the source code details render in tab-details-content.tsx
          <RepositoryDetails repository={application.assets} />
        ) : (
          <EmptyTextMessage />
        )}
      </DrawerTabContentSection>

      <DrawerTabContentSection label={t("terms.applicationDiscoveryManifest")}>
        {manifest ? (
          <SchemaDefinedField isReadOnly jsonDocument={manifest} />
        ) : (
          <EmptyTextMessage />
        )}
      </DrawerTabContentSection>
    </DrawerTabContent>
  );
};
