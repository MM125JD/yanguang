import { defineConfig } from 'vitepress'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 🔍 核心黑科技：全自动扫描所有一级文件夹
const rootDir = path.resolve(__dirname, '..')
const autoSidebar = []

// 需要被忽略的系统级垃圾文件夹和文件
const blacklist = ['.git', '.github', '.idea', '.obsidian', '.vitepress', 'node_modules', 'public']

if (fs.existsSync(rootDir)) {
  const items = fs.readdirSync(rootDir)

  items.forEach(item => {
    const itemPath = path.join(rootDir, item)
    const stat = fs.statSync(itemPath)

    // 如果是文件夹，并且不在黑名单里，就代表它是一个知识分类！
    if (stat.isDirectory() && !blacklist.includes(item)) {
      // 全自动扫描这个分类下的所有 md 文件
      const files = fs.readdirSync(itemPath)
          .filter(file => file.endsWith('.md'))
          .map(file => {
            const name = file.replace('.md', '')
            return {
              text: name === 'index' ? `🏠 ${item} 首页` : name,
              link: `/${item}/${name}`
            }
          })

      // 如果文件夹里有 md 文件，就自动在侧边栏生成一个大分类
      if (files.length > 0) {
        autoSidebar.push({
          text: `📁 ${item}`, // 分类名字直接用你的文件夹名字！
          collapsible: true,
          collapsed: false,
          items: files
        })
      }
    }
  })
}

export default defineConfig({
  title: "双的小屋",
  description: "日记与前端碎碎念",

  // 依然保留你的智能双链翻译
  markdown: {
    config: (md) => {
      const defaultRender = md.renderer.rules.text || function(tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
      };
      md.renderer.rules.text = (tokens, idx, options, env, self) => {
        let content = tokens[idx].content;
        const regex = /\[\[(.*?)\]\]/g;
        if (regex.test(content)) {
          content = content.replace(regex, (match, p1) => {
            return `<a href="/dairy/${p1}" class="vp-link">${p1}</a>`;
          });
          tokens[idx].content = content;
          tokens[idx].type = 'html_inline';
        }
        return defaultRender(tokens, idx, options, env, self);
      };
    }
  },

  themeConfig: {
  // 💡 开启全自动一键呼叫 Obsidian 编辑功能
  editLink: {
    pattern: 'obsidian://open?vault=yanguang&file=:path', // 👈 这里的 vault=后面写你 Obsidian 的库名字
        text: '✍️ 在 Obsidian 中编辑这篇文章'
  },search: {
      provider: 'local'
    },
    // 💡 躺平核心：侧边栏完全交给上面全自动计算出来的数组！
    sidebar: autoSidebar,

    nav: [
      { text: '首页', link: '/' }
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com' }]
  }
})