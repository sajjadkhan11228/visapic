export const metadata = {
  title: "Contact VisaPic",
  description:
    "Contact VisaPic for questions, suggestions, feedback, or technical issues.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <article className="prose prose-slate max-w-none">
        <h1>Contact VisaPic</h1>

        <p>
          We would love to hear from you. If you have a question, suggestion,
          feedback, or experience a problem while using VisaPic, you can
          contact us.
        </p>

        <h2>General Questions</h2>

        <p>
          For general questions about VisaPic or our online photo tools, please
          contact us using the email address below.
        </p>

        <p>
          <strong>Email:</strong>{" "}
          <a href="sajjadkhan11228@gmail.com">contact@visapic.com</a>
        </p>

        <h2>Technical Issues</h2>

        <p>
          If one of our tools is not working correctly, please include useful
          information about the problem, such as:
        </p>

        <ul>
          <li>The name of the tool you were using</li>
          <li>What happened</li>
          <li>The type of device you were using</li>
          <li>Your browser, if relevant</li>
        </ul>

        <p>
          Please do not send passwords, payment information, government
          identification numbers, or other highly sensitive personal
          information.
        </p>

        <h2>Suggestions and Feedback</h2>

        <p>
          We welcome suggestions for new photo tools, improvements, and
          features that could make VisaPic easier to use.
        </p>

        <h2>Passport and Visa Requirements</h2>

        <p>
          If you have a question about an official passport or visa photo
          requirement, please also verify the requirement with the relevant
          government authority or application provider.
        </p>

        <p>
          VisaPic is not a government agency, embassy, consulate, or
          immigration authority.
        </p>

        <h2>Response Time</h2>

        <p>
          We try to respond to legitimate questions and feedback as soon as
          reasonably possible. Response times may vary.
        </p>
      </article>
    </main>
  );
}