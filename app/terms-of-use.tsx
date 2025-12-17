import LegalDocumentViewer from "@/components/legal-document-viewer";
import TermsOfUseData from "@/data/terms-of-use.json";
import { LegalDocument } from "@/services/api-service";
import React, { memo } from "react";

function TermsOfUseScreen() {
  return (
    <LegalDocumentViewer
      document={TermsOfUseData.data as LegalDocument}
      fallbackTitle="Terms of Use"
    />
  );
}

export default memo(TermsOfUseScreen);
