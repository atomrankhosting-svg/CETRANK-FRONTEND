import { Navigate } from "react-router-dom";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { getLegalDocument, type LegalSlug } from "@/content/legal";

type Props = {
  slug: LegalSlug;
};

const LegalPage = ({ slug }: Props) => {
  const document = getLegalDocument(slug);

  if (!document) {
    return <Navigate to="/404" replace />;
  }

  return <LegalDocumentPage document={document} />;
};

export default LegalPage;
