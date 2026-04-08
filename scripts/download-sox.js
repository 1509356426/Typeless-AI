/**
 * 自动下载 Sox 音频处理工具
 * Sox 用于 Windows 平台的音频录制
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const AdmZip = require('adm-zip');

const SOX_VERSION = '14.4.2';
const SOX_DIR = path.resolve(__dirname, '../sox-14.4.2');
const SOX_URL = `https://sourceforge.net/projects/sox/files/sox/${SOX_VERSION}/sox-${SOX_VERSION}-win32.zip/download`;

console.log('🔄 开始下载 Sox...\n');

// 创建目录
if (!fs.existsSync(SOX_DIR)) {
  fs.mkdirSync(SOX_DIR, { recursive: true });
}

const zipPath = path.join(SOX_DIR, 'sox.zip');

// 下载文件
console.log(`📥 下载地址: ${SOX_URL}`);
console.log(`📁 保存位置: ${zipPath}\n`);

const file = fs.createWriteStream(zipPath);

https.get(SOX_URL, (response) => {
  // SourceForge 会重定向，跟随重定向
  if (response.statusCode === 302 || response.statusCode === 301) {
    const redirectUrl = response.headers.location;
    console.log(`↪️  重定向到: ${redirectUrl}\n`);

    https.get(redirectUrl, (redirectResponse) => {
      redirectResponse.pipe(file);

      let downloadedBytes = 0;
      const totalBytes = parseInt(redirectResponse.headers['content-length'], 10);

      redirectResponse.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const percent = Math.floor((downloadedBytes / totalBytes) * 100);
        process.stdout.write(`\r⏳ 下载进度: ${percent}% (${(downloadedBytes / 1024 / 1024).toFixed(2)} MB / ${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
      });

      redirectResponse.on('end', () => {
        file.close();
        console.log('\n\n✅ 下载完成！');

        // 解压文件
        console.log('📦 正在解压...\n');
        extractZip();
      });
    }).on('error', (err) => {
      fs.unlinkSync(zipPath);
      console.error('\n❌ 下载失败:', err.message);
      process.exit(1);
    });
  } else {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('\n\n✅ 下载完成！');
      console.log('📦 正在解压...\n');
      extractZip();
    });
  }
}).on('error', (err) => {
  fs.unlinkSync(zipPath);
  console.error('\n❌ 下载失败:', err.message);
  console.log('\n💡 提示: 您也可以手动下载 Sox:');
  console.log('   1. 访问: https://sourceforge.net/projects/sox/files/sox/14.4.2/');
  console.log('   2. 下载: sox-14.4.2-win32.zip');
  console.log('   3. 解压到项目根目录的 sox-14.4.2 文件夹\n');
  process.exit(1);
});

function extractZip() {
  try {
    // 使用 adm-zip 解压
    console.log('📦 使用 adm-zip 解压...\n');
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(SOX_DIR, true);

    // 删除 zip 文件
    fs.unlinkSync(zipPath);

    // 找到 sox.exe 并移动到正确位置
    findAndMoveSoxExe();

    console.log('\n✅ Sox 安装完成！');
    console.log(`📁 安装位置: ${SOX_DIR}\n`);

    // 验证安装
    verifyInstallation();

  } catch (err) {
    console.error('\n❌ 解压失败:', err.message);
    console.log('\n💡 提示: 您也可以手动解压 zip 文件\n');
    process.exit(1);
  }
}

function findAndMoveSoxExe() {
  // 递归查找 sox.exe
  function findFile(dir, fileName) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        const result = findFile(filePath, fileName);
        if (result) return result;
      } else if (file === fileName) {
        return filePath;
      }
    }
    return null;
  }

  const soxExePath = findFile(SOX_DIR, 'sox.exe');

  if (soxExePath) {
    const targetDir = path.dirname(soxExePath);
    console.log(`\n🔍 找到 sox.exe: ${soxExePath}`);
    console.log(`📂 Sox 目录: ${targetDir}`);

    // 更新环境变量指向正确位置
    const soxDirPath = path.resolve(SOX_DIR, 'sox');
    if (!fs.existsSync(soxDirPath)) {
      fs.mkdirSync(soxDirPath, { recursive: true });
    }

    // 复制必要文件到 sox-14.4.2/sox 目录
    const files = fs.readdirSync(targetDir);
    for (const file of files) {
      const srcPath = path.join(targetDir, file);
      const destPath = path.join(soxDirPath, file);
      fs.copyFileSync(srcPath, destPath);
    }

    console.log(`✅ Sox 文件已复制到: ${soxDirPath}\n`);
  } else {
    console.log('\n⚠️  未找到 sox.exe，可能解压结构不同');
  }
}

function verifyInstallation() {
  const soxPath = path.join(SOX_DIR, 'sox', 'sox.exe');

  if (fs.existsSync(soxPath)) {
    try {
      const version = execSync(`"${soxPath}" --version`, { encoding: 'utf8' });
      console.log('📌 Sox 版本信息:');
      console.log(version.split('\n')[0]);
      console.log('\n🎉 Sox 已就绪，可以开始录音了！\n');
    } catch (err) {
      console.log('\n⚠️  Sox 安装可能不完整，请检查文件是否完整\n');
    }
  } else {
    console.log('\n⚠️  未找到 sox.exe，请手动检查安装\n');
  }
}
