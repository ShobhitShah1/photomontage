import LegalDocumentViewer from "@/components/legal-document-viewer";
import LibraryLicenseData from "@/data/library-license.json";
import { LegalDocument } from "@/services/api-service";
import React, { memo } from "react";

function OpenSourceLicenseScreen() {
  return (
    <LegalDocumentViewer
      document={LibraryLicenseData.data as unknown as LegalDocument}
      fallbackTitle="Open Source Licenses"
    />
  );
}

export default memo(OpenSourceLicenseScreen);
