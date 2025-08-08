// SEO 配置接口
export interface SEOConfig {
  title?: string
  description?: string
  keywords?: string[]
  url?: string
  image?: string
  type?: string
  siteName?: string
  locale?: string
}

// 默认 SEO 配置
const defaultSEOConfig: SEOConfig = {
  title: '智能发票重命名工具 - 免费在线PDF发票批量重命名',
  description: '免费在线PDF发票重命名工具，智能提取发票信息，支持批量重命名，自定义命名规则，本地处理保护隐私。让文件管理变得简单高效。',
  keywords: ['发票重命名', 'PDF重命名', '发票管理', '批量重命名', '发票工具', '文件管理'],
  url: 'https://fapiao.haohio.xyz',
  image: '/favicon.ico',
  type: 'website',
  siteName: '智能发票重命名工具',
  locale: 'zh_CN'
}

// 生成 SEO 配置
export function generateSEO(config: Partial<SEOConfig> = {}): SEOConfig {
  return {
    ...defaultSEOConfig,
    ...config
  }
}

// 生成 Meta 标签
export function generateMetaTags(config: SEOConfig) {
  return [
    { name: 'description', content: config.description },
    { name: 'keywords', content: config.keywords?.join(', ') },
    { name: 'author', content: config.siteName },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    
    // Open Graph
    { property: 'og:title', content: config.title },
    { property: 'og:description', content: config.description },
    { property: 'og:type', content: config.type },
    { property: 'og:url', content: config.url },
    { property: 'og:image', content: config.image },
    { property: 'og:site_name', content: config.siteName },
    { property: 'og:locale', content: config.locale },
    
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: config.title },
    { name: 'twitter:description', content: config.description },
    { name: 'twitter:image', content: config.image },
    
    // 其他 Meta 标签
    { name: 'robots', content: 'index, follow' },
    { name: 'googlebot', content: 'index, follow' },
    { name: 'theme-color', content: '#667eea' }
  ]
}

// 生成结构化数据
export function generateStructuredData(config: SEOConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: config.siteName,
    description: config.description,
    url: config.url,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY'
    },
    featureList: [
      '智能提取发票信息',
      '批量重命名PDF文件',
      '自定义命名规则',
      '本地处理保护隐私'
    ],
    author: {
      '@type': 'Organization',
      name: config.siteName
    }
  }
}