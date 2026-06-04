import {
  Accordion,
  Heading,
  InteractiveBook,
  Page,
  Text,
  TrueFalse,
} from "@lessonkit/react";

export function HandbookLesson() {
  return (
    <>
      <Heading blockId="handbook-intro" level={2}>
        Analyst handbook
      </Heading>
      <Text>
        Compound containers resume navigation in session storage. Flip pages, answer the checkpoint, then return
        later—your place is restored when <code>persistCompoundState</code> is enabled (the default in 1.2).
      </Text>

      <InteractiveBook blockId="analyst-handbook" title="Atlas analyst handbook" showBookScore>
        <Page blockId="handbook-welcome" title="Welcome">
          <Heading blockId="handbook-page-title" level={3}>
            Before you query
          </Heading>
          <Text>
            Atlas workspaces inherit SSO from your identity provider. Production tenants require MFA and an
            approved use case on file.
          </Text>
        </Page>

        <Page blockId="handbook-policies" title="Policies">
          <Accordion
            blockId="handbook-accordion"
            sections={[
              {
                id: "exports",
                title: "Export rules",
                content: (
                  <Text>CSV exports land in the vault for 30 days, then expire automatically.</Text>
                ),
              },
              {
                id: "alerts",
                title: "Alert handling",
                content: (
                  <Text>Acknowledge critical alerts within 15 minutes and note actions in the muster channel.</Text>
                ),
              },
            ]}
          />
        </Page>

        <Page blockId="handbook-check" title="Checkpoint">
          <TrueFalse
            checkId="handbook-sso-tf"
            question="SSO is optional for production Atlas workspaces."
            answer={false}
          />
        </Page>
      </InteractiveBook>
    </>
  );
}
