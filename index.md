---
layout: home
hero:
  name: "双的小屋"
  text: "欢迎来到我的个人博客"
  tagline: "日记与碎碎念"
  actions:
    - theme: brand
      text: 开启阅读
      link: /dairy/index  # 👈 核心：让它跳转到 dairy 文件夹下的 index.md 页面！

---
<div style="padding: 20px; border: 1px dashed #3eaf7c; border-radius: 8px; margin-top: 20px; background: rgba(62, 175, 124, 0.05);">
  <h4 style="margin-top: 0; color: #3eaf7c;">🚀 赛博控制台</h4>
  <p style="font-size: 14px; margin: 8px 0;">点击下方按钮，绕过 Vue 沙箱直接唤醒浏览器底层弹窗：</p>

  <!-- 💡 核心：确保 <button onclick... 写在同一行，别换行 -->
<button onclick="alert('陈双，恭喜你！这颗按钮已经成功穿透网页，和你的浏览器达成底层交互！')" style="background: #3eaf7c; color: white; padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer; font-weight: bold;">点我一下试试</button>
</div>