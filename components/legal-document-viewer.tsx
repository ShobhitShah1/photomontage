import { Text, useCommonThemedStyles, View } from "@/components/themed";
import { FontFamily } from "@/constants/fonts";
import { useTheme } from "@/context/theme-context";
import { LegalDocument } from "@/services/api-service";
import React, { memo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import RenderHtml, {
  MixedStyleDeclaration,
  RenderersProps,
} from "react-native-render-html";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface LegalDocumentViewerProps {
  document: LegalDocument;
  fallbackTitle: string;
}

function LegalDocumentViewer({
  document,
  fallbackTitle,
}: LegalDocumentViewerProps) {
  const { theme } = useTheme();
  const commonStyles = useCommonThemedStyles();
  const { bottom } = useSafeAreaInsets();

  // const loadDocument = useCallback(async () => {
  //   try {
  //     setLoading(true);
  //     setError(null);
  //     const response = await fetchDocument();
  //     setDocument(response.data);
  //   } catch (err) {
  //     setError("Failed to load document. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [fetchDocument]);

  // useEffect(() => {
  //   loadDocument();
  // }, [loadDocument]);

  const htmlContent = document?.content || "";
  const title = document?.title || fallbackTitle;
  const lastUpdated = document?.updatedAt
    ? new Date(document.updatedAt).toLocaleDateString()
    : "Unknown";

  const cleanedHtmlContent = htmlContent
    .replace(/<h3>/g, "<h2>")
    .replace(/<\/h3>/g, "</h2>")
    .replace(/<br\s*\/?>/g, "<br />")
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim();

  const htmlRenderersProps: Partial<RenderersProps> | undefined = {
    baseStyle: {
      fontSize: 15,
      fontFamily: FontFamily.medium,
      lineHeight: 22,
      color: theme.textSecondary,
    },
  };

  const tagsStyles:
    | Readonly<Record<string, MixedStyleDeclaration>>
    | undefined = {
    h1: {
      fontSize: 24,
      fontFamily: FontFamily.bold,
      color: theme.textPrimary,
      marginBottom: 16,
      marginTop: 24,
    },
    h2: {
      fontSize: 20,
      fontFamily: FontFamily.bold,
      color: theme.textPrimary,
      marginBottom: 12,
      marginTop: 20,
    },
    h3: {
      fontSize: 18,
      fontFamily: FontFamily.bold,
      color: theme.textPrimary,
      marginBottom: 10,
      marginTop: 16,
    },
    p: {
      fontSize: 15,
      fontFamily: FontFamily.medium,
      lineHeight: 22,
      color: theme.textSecondary,
      marginBottom: 12,
    },
    ul: {
      color: theme.textSecondary,
      marginBottom: 12,
    },
    ol: {
      color: theme.textSecondary,
      marginBottom: 12,
    },
    li: {
      fontSize: 15,
      fontFamily: FontFamily.medium,
      lineHeight: 22,
      color: theme.textSecondary,
      marginBottom: 8,
    },
    a: {
      color: theme.accent,
      textDecorationLine: "underline" as const,
    },
    br: {
      marginBottom: 8,
    },
  };

  return (
    <View style={[commonStyles.container, { paddingBottom: bottom }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {/* <Text style={[styles.title, { color: theme.textPrimary }]}>
            {title}
          </Text> */}
          <Text style={[styles.lastUpdated, { color: theme.textSecondary }]}>
            Last updated: {lastUpdated}
          </Text>
        </View>

        <View style={styles.content}>
          <RenderHtml
            contentWidth={300}
            source={{ html: cleanedHtmlContent }}
            renderersProps={htmlRenderersProps}
            tagsStyles={tagsStyles}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  header: {
    marginVertical: 5,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    textAlign: "center",
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    fontStyle: "italic",
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
  },
});

export default memo(LegalDocumentViewer);
