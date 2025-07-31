import * as React from "react";
import { useTranslation } from "react-i18next";

import { DecoratedApplication } from "../useDecoratedApplications";
import { useFetchApplicationManifest } from "@app/queries/applications";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { SchemaDefinedField } from "@app/components/schema-defined-fields/SchemaDefinedFields";
import {
  DrawerTabContent,
  DrawerTabContentSection,
  RepositoryDetails,
} from "@app/components/detail-drawer";

/**
 * Show the platform awareness and asset generation details for the application.
 */
export const TabPlatformContent: React.FC<{
  application: DecoratedApplication;
}> = ({ application }) => {
  const { t } = useTranslation();
  const { manifest } = useFetchApplicationManifest(application?.id);

  return (
    <DrawerTabContent>
      <DrawerTabContentSection label={t("terms.sourcePlatform")}>
        {application.platform?.name || <EmptyTextMessage />}
        {/* TODO: Do we need to add the platform details here? */}
      </DrawerTabContentSection>

      <DrawerTabContentSection label={t("terms.sourcePlatformCoordinates")}>
        {application.coordinates ? (
          <SchemaDefinedField
            baseJsonDocument={application.coordinates?.content}
            jsonSchema={application.coordinates?.schema}
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
          <SchemaDefinedField baseJsonDocument={manifest} />
        ) : (
          <EmptyTextMessage />
        )}
      </DrawerTabContentSection>
    </DrawerTabContent>
  );
};
