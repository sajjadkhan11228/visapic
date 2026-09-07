import SimplePage from "../components/SimplePage";

export default function TermsPage() {
  return (
    <SimplePage title="Terms of Use" description="Basic terms for using VisaPic tools.">
      <h2>Use of the tools</h2>
      <p>
        VisaPic provides image editing and requirement guidance tools for
        convenience. You are responsible for checking the current official
        requirements of the authority handling your application.
      </p>
      <h2>No acceptance guarantee</h2>
      <p>
        A generated image is not a guarantee that a passport office, embassy,
        immigration authority or visa application system will accept it.
      </p>
      <h2>Accuracy</h2>
      <p>
        Requirements can change by country, document type and application.
        Verify the official instructions before submission.
      </p>
    </SimplePage>
  );
}
