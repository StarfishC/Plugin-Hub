const data = "data/third/AdGuardHome"; // AdGuardHome主目录
const pidfile = data + "/pid.txt"; // 运行时PID
const execfile = data + "/AdGuardHome.exe"; // 主程序
const execargs = []; // 运行时参数
const version = "v0.107.43"; // 版本，可自行更改升级
const cachefile = `data/.cache/adguard_${version}.zip`; // 主程序压缩文件

const { arch } = await Plugins.GetEnv();

const url = `https://github.com/AdguardTeam/AdGuardHome/releases/download/${version}/AdGuardHome_windows_${arch}.zip`;

/* 停止运行AdGuardHome */
const stopAdGuardHome = async () => {
  const pid = await Plugins.Readfile(pidfile);
  const name = await Plugins.ProcessInfo(Number(pid));
  if (name.startsWith("AdGuardHome")) {
    await Plugins.KillProcess(Number(pid));
  }
  await Plugins.Removefile(pidfile);
};

/* 运行AdGuardHome */
const runAdGuardHome = async () => {
  const pid = await Plugins.ExecBackground(
    execfile,
    execargs,
    (out) => {
      if (out.includes("go to")) {
        Plugins.message.info(
          "AdGuardHome管理地址：" + out.split("go to")[1],
          5_000
        );
      }
      if (out.includes("dnsproxy: listening to")) {
        Plugins.message.info(
          "AdGuardHome服务地址：" + out.split("dnsproxy: listening to")[1],
          5_000
        );
      }
    },
    async () => {
      console.log("AdGuardHome.exe stopped");
      await Plugins.Removefile(pidfile);
    }
  );
  await Plugins.Writefile(pidfile, pid.toString());
};

/* 安装AdGuardHome */
const installAdGuardHome = async () => {
  if (!(await Plugins.FileExists(cachefile))) {
    console.log("下载AdGuardHome压缩包");
    await Plugins.Download(url, cachefile);
    console.log("下载AdGuardHome完成");
  }
  console.log("解压AdGuardHome压缩包");
  await Plugins.UnzipZIPFile(cachefile, "data/third");
  console.log("解压AdGuardHome完成");
};

/* 卸载AdGuardHome */
const uninstallAdGuardHome = async () => {
  if (await Plugins.FileExists(pidfile)) {
    throw "请先停止运行AdGuardHome";
  }
  await Plugins.Removefile(data);
};

const onInstall = async () => {
  await installAdGuardHome();
};

const onUninstall = async () => {
  await uninstallAdGuardHome();
};

// 默认不启用，请在插件编辑里勾选对应的触发器
const onStartup = async () => {
  if (await Plugins.FileExists(pidfile)) {
    const pid = await Plugins.Readfile(pidfile);
    try {
      const name = await Plugins.ProcessInfo(Number(pid));
      if (name.startsWith("AdGuardHome")) {
        return;
      }
      await Plugins.Removefile(pidfile);
    } catch (error) {}
  }
  await runAdGuardHome();
};

// 默认不启用，请在插件编辑里勾选对应的触发器
const onShutdown = async () => {
  if (!(await Plugins.FileExists(pidfile))) {
    return;
  }
  await stopAdGuardHome();
};

const onRun = async () => {
  if (await Plugins.FileExists(pidfile)) {
    await stopAdGuardHome();
    Plugins.message.info("AdGuardHome停止成功");
  } else {
    await runAdGuardHome();
  }
};