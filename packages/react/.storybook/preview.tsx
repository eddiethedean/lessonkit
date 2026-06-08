import type { Preview } from "@storybook/react";
import React from "react";
import "@lessonkit/themes/base.css";
import { ThemeProvider } from "../src/theme/ThemeProvider";

const preview: Preview = {
  parameters: {
    layout: "padded",
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default preview;
