import { relaunch } from "@tauri-apps/plugin-process";
import type { Update } from "@tauri-apps/plugin-updater";
import { check } from "@tauri-apps/plugin-updater";
import type { Action } from "element-plus";
import { acceptHMRUpdate, defineStore } from "pinia";
import { disable } from "@tauri-apps/plugin-autostart";

// @unocss-include
// https://pinia.web3doc.top/ssr/nuxt.html#%E5%AE%89%E8%A3%85
export const useSettingStore = defineStore(
  "setting",
  () => {
    const sysPermission = ref({
      isNotification: false,
      isNotificationSound: true,
    });
    const appUploader = ref({
      isCheckUpdatateLoad: false,
      isUpdating: false,
      isUpload: false,
      version: "",
      newVersion: "",
      contentLength: 0,
      downloaded: 0,
      downloadedText: "",
      ignoreVersion: [] as string[],
    });

    // 用户页折叠
    const isUserFold = ref(true);
    const isUserCollapse = ref(true);
    // 主页页折叠
    const isFold = ref(true);
    const isCollapse = ref(true);
    const isMobile = ref(false);
    // ---------------------设置-----------------
    const settingPage = ref({
      // 字体
      fontFamily: {
        value: "Alimama",
        list: [] as { name: string; value: string }[],
      },
      modeToggle: {
        value: "auto",
        list: [
          { name: "自动", value: "auto" },
          { name: "日间", value: "light" },
          { name: "夜间", value: "dark" },
        ],
      },
      isAutoStart: false, // 开机自启
      isColseAllTransition: false, // 是否关闭所有动画效果，包括页面切换动画和组件动画。
      isEscMin: false, // esc
    });
    const contactBtnPosition = ref({
      x: 0,
      y: 0,
    });
    const isChatFold = ref(false);
    const isThemeChangeLoad = ref(false);
    // --------------------- 聊天设置 -----------------
    const isOpenGroupMember = ref(true); // 是否打开 群聊成员菜单列表
    const isOpenContact = ref(true);// 是否打开会话列表
    const showChatMenu = ref(true);
    const downUpChangeContact = ref(true); // 向上向下切换联系人列表


    /**
     * 检查更新
     * @returns 是否更新
     */
    async function checkUpdates(checkLog = false) {
      appUploader.value.isCheckUpdatateLoad = true;
      try {
        const update = await check() as Update;
        appUploader.value.isUpload = !!update?.available;
        appUploader.value.isCheckUpdatateLoad = false;
        if (!appUploader.value.isUpload || !update.version) {
          appUploader.value.isCheckUpdatateLoad = false;
          appUploader.value.isUpdating = false;
          appUploader.value.isUpload = false;
          const route = useRoute();
          if (route.path.includes("/setting"))
            ElMessage.info("当前版本已是最新版本！");
          return false;
        }
        // 检查是否忽略当前版本
        if (checkLog && appUploader.value.ignoreVersion.includes(update.version))
          return false;
        ElMessageBox.confirm("检测到新版本，是否更新？", `版本 ${update.version}`, {
          confirmButtonText: "确定",
          cancelButtonText: "忽略此版本",
          center: true,
          callback: async (action: Action) => {
            if (action === "confirm") {
              // ElLoading.service({ fullscreen: true, text: "正在更新，请稍等..." });
              appUploader.value.isUpdating = true;
              update.downloadAndInstall((e) => {
                switch (e.event) {
                  case "Started":
                    console.log(e.data.contentLength);
                    appUploader.value.contentLength = e.data.contentLength || 0;
                    console.log(`开始下载，长度 ${e.data.contentLength} bytes`);
                    break;
                  case "Progress":
                    appUploader.value.downloaded += e.data.chunkLength || 0;
                    appUploader.value.downloadedText = `${((appUploader.value.downloaded || 0) / 1024 / 1024).toFixed(2)}MB / ${((appUploader.value.contentLength || 0) / 1024 / 1024).toFixed(2)}MB`;
                    console.log(`下载中 ${appUploader.value.downloadedText}`);
                    break;
                  case "Finished":
                    console.log("下载完成");
                    appUploader.value.isUpload = false;
                    appUploader.value.isCheckUpdatateLoad = false;
                    appUploader.value.isUpdating = false;
                    appUploader.value.downloaded = 0;
                    appUploader.value.downloadedText = "";
                    appUploader.value.contentLength = 0;
                    appUploader.value.newVersion = "";
                    break;
                }
              }).then(async (val) => {
                console.log(val);
                await relaunch();
              }).catch((error) => {
                console.error(error);
                ElMessage.error("更新失败！请检查网络或稍后再试！");
              }).finally(() => {
                appUploader.value.isCheckUpdatateLoad = false;
                appUploader.value.isUpload = false;
                appUploader.value.isCheckUpdatateLoad = false;
                appUploader.value.isUpdating = false;
                appUploader.value.downloaded = 0;
                appUploader.value.downloadedText = "";
                appUploader.value.contentLength = 0;
                appUploader.value.newVersion = "";
              });
            }
            else if (action === "cancel") {
              if (!appUploader.value.ignoreVersion.includes(update.version))
                appUploader.value.ignoreVersion.push(update.version);
            }
          },
        });
      }
      catch (error) {
        console.error(error);
        appUploader.value.isCheckUpdatateLoad = false;
        appUploader.value.isUpdating = false;
        appUploader.value.isUpload = false;
      }
    }

    async function loadSystemFonts() {
      settingPage.value.fontFamily.list = [
        { name: "阿里妈妈方圆体", value: "Alimama" },
        { name: "字玩哥特黑白无常体", value: "ZiWanGeTe" },
        { name: "阿里健康体2.0", value: "AlibabaHealthFont2" },
        { name: "阿里妈妈刀隶体", value: "AlimamaDaoLiTi" },
        { name: "阿里妈妈东方大楷", value: "Alimama_DongFangDaKai" },
      ];
      // @ts-expect-error
      if (window.queryLocalFonts) {
        try {
        // @ts-expect-error
          const availableFonts = await window.queryLocalFonts();
          // 获取前20个可用字体
          const fontsMap = {} as { [key: string]: { name: string; value: string } };
          availableFonts.forEach((font: any) => {
            if (fontsMap[font.family])
              return;
            fontsMap[font.family] = {
              name: font.family,
              value: font.family,
            };
          });
          const arr = [
            ...settingPage.value.fontFamily.list,
            ...Object.values(fontsMap),
          ];
          settingPage.value.fontFamily.list = arr;
        }
        catch (err) {
          console.error(err);
        }
      }
    }

    function reset() {
      settingPage.value.fontFamily.value = "Alimama";
      settingPage.value.modeToggle.value = "auto";
      settingPage.value.isColseAllTransition = false;
      settingPage.value.isEscMin = true;
      isChatFold.value = false;
      isOpenContact.value = true;
      isOpenGroupMember.value = true;
      showChatMenu.value = true;
      isThemeChangeLoad.value = false;
      appUploader.value = {
        isCheckUpdatateLoad: false,
        isUpdating: false,
        isUpload: false,
        version: "",
        newVersion: "",
        contentLength: 0,
        downloaded: 0,
        downloadedText: "",
        ignoreVersion: [] as string[],
      };
      contactBtnPosition.value = { x: 0, y: 0 };
      isMobile.value = false;
      isFold.value = true;
      isCollapse.value = true;
      isUserFold.value = true;
      isUserCollapse.value = true;

      sysPermission.value = {
        isNotification: false,
        isNotificationSound: true,
      };
      settingPage.value = {
        // 字体
        fontFamily: {
          value: "Alimama",
          list: [],
        },
        modeToggle: {
          value: "auto",
          list: [
            { name: "自动", value: "auto" },
            { name: "日间", value: "light" },
            { name: "夜间", value: "dark" },
          ],
        },
        isAutoStart: false, // 开机自启
        isColseAllTransition: false, // 是否关闭所有动画效果，包括页面切换动画和组件动画。
        isEscMin: true, // esc
      };

      disable();// 关闭自启动
      loadSystemFonts();
    }
    return {
      isMobile,
      isChatFold,
      // state
      isCollapse,
      isOpenContact,
      isOpenGroupMember,
      isFold,
      isUserCollapse,
      isUserFold,
      sysPermission,
      settingPage,
      isThemeChangeLoad,
      appUploader,
      showChatMenu,
      contactBtnPosition,
      downUpChangeContact,
      // actions
      checkUpdates,
      loadSystemFonts,
      reset,
      // getter
    };
  },
  {
    // https://prazdevs.github.io/pinia-plugin-persistedstate/frameworks/nuxt-3.html
    persist: {
      storage: persistedState.localStorage,
    },
  },
);
if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useSettingStore, import.meta.hot));
