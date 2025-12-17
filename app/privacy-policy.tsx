import LegalDocumentViewer from "@/components/legal-document-viewer";
import PrivacyPolicyData from "@/data/privacy-policy.json";
import { LegalDocument } from "@/services/api-service";
import React, { memo } from "react";

function PrivacyPolicyScreen() {
  return (
    <LegalDocumentViewer
      document={PrivacyPolicyData.data as LegalDocument}
      fallbackTitle="Privacy Policy"
    />
  );
}

export default memo(PrivacyPolicyScreen);
