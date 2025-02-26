import logger from "./pino-logger.ts";
import { emojis } from "./pino-logger.ts";

/**
 * Valid border styles for boxes
 */
export type BorderStyle = "single" | "double" | "round" | "bold" | "classic";

/**
 * BoxStyle defines the visual appearance of the box
 */
export interface BoxStyle {
  padding?: number;
  margin?: number;
  borderStyle?: BorderStyle;
  borderColor?: string;
  title?: string;
  titleAlignment?: "left" | "center" | "right";
  width?: number;
  dimBorder?: boolean;
}

/**
 * BoxOptions defines all options for creating a box
 */
export interface BoxOptions extends BoxStyle {
  level?: "info" | "warn" | "error" | "fatal" | "debug";
}

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
 * Preset styles for different types of boxes
 */
export const presets: Record<string, BoxStyle> = {
  info: {
    ...defaultStyle,
    borderStyle: "round",
  },
  success: {
    ...defaultStyle,
    borderStyle: "classic",
  },
  warning: {
    ...defaultStyle,
    borderStyle: "single",
  },
  error: {
    ...defaultStyle,
    borderStyle: "double",
  },
  startup: {
    ...defaultStyle,
    borderStyle: "bold",
    padding: 1,
  },
};

/**
 * Unicode box characters for different border styles
 */
export const borders: Record<BorderStyle, Record<string, string>> = {
  single: {
    topLeft: "┌",
    topRight: "┐",
    bottomLeft: "└",
    bottomRight: "┘",
    horizontal: "─",
    vertical: "│",
    top: "┬",
    bottom: "┴",
  },
  double: {
    topLeft: "╔",
    topRight: "╗",
    bottomLeft: "╚",
    bottomRight: "╝",
    horizontal: "═",
    vertical: "║",
    top: "╦",
    bottom: "╩",
  },
  round: {
    topLeft: "╭",
    topRight: "╮",
    bottomLeft: "╰",
    bottomRight: "╯",
    horizontal: "─",
    vertical: "│",
    top: "┬",
    bottom: "┴",
  },
  bold: {
    topLeft: "┏",
    topRight: "┓",
    bottomLeft: "┗",
    bottomRight: "┛",
    horizontal: "━",
    vertical: "┃",
    top: "┳",
    bottom: "┻",
  },
  classic: {
    topLeft: "+",
    topRight: "+",
    bottomLeft: "+",
    bottomRight: "+",
    horizontal: "-",
    vertical: "|",
    top: "+",
    bottom: "+",
  },
};

/**
 * Creates a boxed message in the console using Unicode box characters
 */
export function boxen(text: string, options: BoxOptions = {}): string {
  // Apply default options
  const opts = { ...defaultStyle, ...options };
  const borderStyle = opts.borderStyle || "single";
  
  // Ensure borderStyle is valid
  const borderChars = borders[borderStyle as BorderStyle];
  
  // Split the text into lines
  const lines = text.split("\n");
  
  // Calculate the max content width
  let contentWidth = 0;
  for (const line of lines) {
    contentWidth = Math.max(contentWidth, line.length);
  }
  
  // Apply fixed width if specified
  if (opts.width && opts.width > contentWidth) {
    contentWidth = opts.width;
  }
  
  // Calculate total width including padding
  const paddingWidth = (opts.padding || 0) * 2;
  const totalWidth = contentWidth + paddingWidth;
  
  // Build the box
  let result = "";
  
  // Add title if provided
  let topBorder = borderChars.topLeft + borderChars.horizontal.repeat(totalWidth) + borderChars.topRight;
  if (opts.title) {
    const titleStr = ` ${opts.title} `;
    const titleLen = titleStr.length;
    const alignment = opts.titleAlignment || "center";
    
    let leftPadding = 0;
    if (alignment === "center") {
      leftPadding = Math.floor((totalWidth - titleLen) / 2);
    } else if (alignment === "right") {
      leftPadding = totalWidth - titleLen;
    }
    
    // Ensure leftPadding is at least 1
    leftPadding = Math.max(1, leftPadding);
    
    // Ensure we don't exceed the width
    if (leftPadding + titleLen > totalWidth) {
      leftPadding = 1;
    }
    
    const rightPadding = totalWidth - leftPadding - titleLen;
    
    topBorder = borderChars.topLeft + 
                borderChars.horizontal.repeat(leftPadding) + 
                titleStr + 
                borderChars.horizontal.repeat(rightPadding) + 
                borderChars.topRight;
  }
  
  // Add top border
  result += topBorder + "\n";
  
  // Add top padding
  for (let i = 0; i < (opts.padding || 0); i++) {
    result += borderChars.vertical + " ".repeat(totalWidth) + borderChars.vertical + "\n";
  }
  
  // Add content with padding
  for (const line of lines) {
    const paddingLeft = " ".repeat(opts.padding || 0);
    const paddingRight = " ".repeat(totalWidth - line.length - (opts.padding || 0));
    result += borderChars.vertical + paddingLeft + line + paddingRight + borderChars.vertical + "\n";
  }
  
  // Add bottom padding
  for (let i = 0; i < (opts.padding || 0); i++) {
    result += borderChars.vertical + " ".repeat(totalWidth) + borderChars.vertical + "\n";
  }
  
  // Add bottom border
  result += borderChars.bottomLeft + borderChars.horizontal.repeat(totalWidth) + borderChars.bottomRight;
  
  return result;
}

/**
 * Log a boxed message at the specified log level
 */
export function logBox(
  message: string, 
  options: BoxOptions = {}
): void {
  const level = options.level || "info";
  const boxedMessage = boxen(message, options);
  
  switch (level) {
    case "debug":
      logger.debug(boxedMessage);
      break;
    case "info":
      logger.info(boxedMessage);
      break;
    case "warn":
      logger.warn(boxedMessage);
      break;
    case "error":
      logger.error(boxedMessage);
      break;
    case "fatal":
      logger.fatal(boxedMessage);
      break;
    default:
      logger.info(boxedMessage);
  }
}

/**
 * Log startup messages in a prominent box
 */
export function logStartup(
  appName: string, 
  version: string = "1.0.0", 
  description: string = ""
): void {
  const message = `${emojis.startup} ${appName} v${version}\n${description}`;
  logBox(message, { 
    ...presets.startup, 
    title: "🎧 SYSTEM STARTUP"
  });
}

/**
 * Log a success message in a box
 */
export function logSuccess(
  message: string, 
  title: string = "SUCCESS"
): void {
  logBox(message, { 
    ...presets.success, 
    title: `✅ ${title}`
  });
}

/**
 * Log an error message in a box
 */
export function logError(
  message: string, 
  title: string = "ERROR"
): void {
  logBox(message, { 
    ...presets.error, 
    title: `❌ ${title}`,
    level: "error"
  });
}

/**
 * Log a warning message in a box
 */
export function logWarning(
  message: string, 
  title: string = "WARNING"
): void {
  logBox(message, { 
    ...presets.warning, 
    title: `⚠️ ${title}`,
    level: "warn"
  });
}

/**
 * Log an information message in a box
 */
export function logInfo(
  message: string, 
  title: string = "INFORMATION"
): void {
  logBox(message, { 
    ...presets.info, 
    title: `ℹ️ ${title}`
  });
}

export default {
  boxen,
  logBox,
  logStartup,
  logSuccess,
  logError,
  logWarning,
  logInfo,
  presets,
};