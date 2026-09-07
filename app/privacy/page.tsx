import SimplePage from "../components/SimplePage";

export default function PrivacyPage() {
  return (
    <SimplePage title="Privacy Policy" description="How VisaPic handles images and basic website usage.">
      <h2>Image processing</h2>
      <p>
        The image tools in this project are designed to process images in the
        browser whenever the selected feature supports local processing.
      </p>
      <h2>Uploads</h2>
      <p>
        VisaPic does not require an account for the current browser-based
        tools. Do not upload documents containing information you do not want
        processed by a third-party website.
      </p>
      <h2>Third-party services</h2>
      <p>
        Before production launch, add the final analytics, advertising and
        hosting disclosures that match the services actually enabled on the
        deployed website.
      </p>
    </SimplePage>
  );
}
