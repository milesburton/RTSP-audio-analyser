/**
 * Configuration for the boxen logger styles
 */
import { emojis } from "./pino-logger.ts";
import { BoxStyle } from "./boxen-logger.ts";

/**
 * Default style for boxes
 */
export const defaultStyle: BoxStyle = {
  padding: 1,
  margin: 0,
  borderStyle: "round",
  dimBorder: false,
  titleAlignment: "center",
};

/**
 * Preset styles for different message types
 */
export const boxStyles: Record<string, BoxStyle> = {
  startup: {
    ...defaultStyle,
    borderStyle: "bold",
    padding: 1,
  },
  success: {
    ...defaultStyle,
    borderStyle: "classic",
    padding: 1,
  },
  info: {
    ...defaultStyle,
    borderStyle: "round",
    padding: 1,
  },
  warning: {
    ...defaultStyle,
    borderStyle: "single",
    padding: 1,
  },
  error: {
    ...defaultStyle,
    borderStyle: "double", 
    padding: 1,
  },
  detection: {
    ...defaultStyle,
    borderStyle: "round",
    padding: 0,
    titleAlignment: "left",
  },
  stats: {
    ...defaultStyle,
    borderStyle: "single",
    padding: 1,
    titleAlignment: "left",
  },
};

/**
 * Standard titles for boxed messages
 */
export const boxTitles: Record<string, string> = {
  startup: `${emojis.startup} SYSTEM STARTUP`,
  success: `${emojis.success} SUCCESS`,
  error: `${emojis.error} ERROR`,
  warning: `${emojis.warning} WARNING`,
  info: `${emojis.info} INFORMATION`,
  config: `${emojis.config} CONFIGURATION`,
  detection: `${emojis.detection} DETECTION`,
  stats: `${emojis.stats} STATISTICS`,
};

export default {
  styles: boxStyles,
  titles: boxTitles,
  defaultStyle,
};