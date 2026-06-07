import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: [],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  core: {
    disableTelemetry: true,
    enableCrashReports: false,
  },
  docs: {
    autodocs: "tag",
  },
  async viteFinal(config, { configType }) {
    if (configType === "PRODUCTION") {
      config.base = process.env.STORYBOOK_BASE_PATH ?? "/lessonkit/storybook/";
    }
    return config;
  },
};

export default config;
