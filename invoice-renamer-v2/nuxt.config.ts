// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@vueuse/nuxt",
    "@unocss/nuxt",
    "@pinia/nuxt",
    "@element-plus/nuxt",
    "@nuxtjs/color-mode",
  ],

  devtools: {
    enabled: true,
  },

  app: {
    // head
    head: {
      title: "智能发票重命名工具 - 免费在线PDF发票批量重命名",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "免费在线智能发票重命名工具，支持PDF发票批量重命名，自动提取发票信息，智能生成文件名。适用于财务管理、报销整理、发票归档等场景。",
        },
        {
          name: "keywords",
          content:
            "发票重命名,PDF重命名,发票管理,批量重命名,发票整理,财务管理,报销管理,发票归档,智能重命名,在线工具",
        },
        {
          name: "author",
          content: "智能发票重命名工具",
        },
        {
          name: "robots",
          content: "index, follow",
        },
        // Open Graph / Facebook
        {
          property: "og:type",
          content: "website",
        },
        {
          property: "og:title",
          content: "智能发票重命名工具 - 免费在线PDF发票批量重命名",
        },
        {
          property: "og:description",
          content:
            "免费在线智能发票重命名工具，支持PDF发票批量重命名，自动提取发票信息，智能生成文件名。",
        },
        {
          property: "og:image",
          content: "/og-image.png",
        },
        {
          property: "og:url",
          content: "https://fapiao.haohio.xyz",
        },
        {
          property: "og:site_name",
          content: "智能发票重命名工具",
        },
        // Twitter
        {
          name: "twitter:card",
          content: "summary_large_image",
        },
        {
          name: "twitter:title",
          content: "智能发票重命名工具 - 免费在线PDF发票批量重命名",
        },
        {
          name: "twitter:description",
          content:
            "免费在线智能发票重命名工具，支持PDF发票批量重命名，自动提取发票信息，智能生成文件名。",
        },
        {
          name: "twitter:image",
          content: "/og-image.png",
        },
        // 移动端优化
        {
          name: "format-detection",
          content: "telephone=no",
        },
        {
          name: "apple-mobile-web-app-capable",
          content: "yes",
        },
        {
          name: "apple-mobile-web-app-status-bar-style",
          content: "black-translucent",
        },
        {
          name: "apple-mobile-web-app-title",
          content: "发票重命名",
        },
        // 主题色
        {
          name: "theme-color",
          content: "#667eea",
        },
        {
          name: "msapplication-TileColor",
          content: "#667eea",
        },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "canonical", href: "https://fapiao.haohio.xyz" },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/favicon-16x16.png",
        },
        { rel: "manifest", href: "/site.webmanifest" },
      ],
      script: [
        // 结构化数据
        {
          type: "application/ld+json",
          innerHTML: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "智能发票重命名工具",
            description:
              "免费在线智能发票重命名工具，支持PDF发票批量重命名，自动提取发票信息，智能生成文件名。",
            url: "https://fapiao.haohio.xyz",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web Browser",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "CNY",
            },
            creator: {
              "@type": "Organization",
              name: "智能发票重命名工具",
            },
            featureList: [
              "PDF发票批量重命名",
              "自动提取发票信息",
              "智能生成文件名",
              "支持多种命名规则",
              "免费在线使用",
            ],
          }),
        },
      ],
    },
  },

  // css
  css: ["@unocss/reset/tailwind.css", "~/assets/scss/index.scss"],

  // vueuse
  vueuse: {
    ssrHandlers: true,
  },

  // colorMode
  colorMode: {
    classSuffix: "",
    preference: "light", // 默认使用浅色模式
    fallback: "light", // 回退到浅色模式
  },

  future: {
    compatibilityVersion: 4,
  },

  experimental: {
    // when using generate, payload js assets included in sw precache manifest
    // but missing on offline, disabling extraction it until fixed
    payloadExtraction: false,
    renderJsonPayloads: false,
    typedPages: true,
  },

  pinia: {
    storesDirs: ["./stores/**"],
  },

  compatibilityDate: "2024-08-14",

  nitro: {
    esbuild: {
      options: {
        target: "esnext",
      },
    },
    prerender: {
      crawlLinks: false,
      routes: ["/"],
      ignore: ["/hi"],
    },
    // 生产环境优化
    minify: true,
    // 静态资源处理
    publicAssets: [
      {
        baseURL: "/",
        dir: "public",
        maxAge: 60 * 60 * 24 * 7, // 7天缓存
      },
    ],
    // 服务器配置
    experimental: {
      wasm: false,
    },
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/scss/element/index.scss" as element;`,
        },
      },
    },
  },

  elementPlus: {
    icon: "ElIcon",
    importStyle: "scss",
    themes: ["dark"],
  },
})
