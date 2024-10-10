import streamSaver from "streamsaver";

export const FILE_MAX_SIZE = 100 * 1024 * 1024;// 100MB
export const FILE_TYPE_ICON_MAP = {
  "text/plain": "/images/icon/TXT.png",

  "application/vnd.ms-excel": "/images/icon/XLS.png",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "/images/icon/XLSX.png",

  "application/vnd.ms-powerpoint": "/images/icon/PPT.png",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "/images/icon/PPTX.png",

  "application/msword": "/images/icon/DOC.png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "/images/icon/DOCX.png",

  "application/pdf": "/images/icon/PDF.png",
  "application/x-pdf": "/images/icon/PDF.png",
  "application/x-bzpdf": "/images/icon/PDF.png",
  "application/x-gzpdf": "/images/icon/PDF.png",
} as Record<string, string>;
/**
 * 默认文件图标
 */
export const FILE_TYPE_ICON_DEFAULT = "/images/icon/DEFAULT.png";


/**
 * 格式化文件大小
 * @param size 字节大小
 * @returns 格式化后的文件大小字符串
 * @example
 * formatFileSize(1024) // "1KB"
 * formatFileSize(1024 * 1024) // "1MB"
 * formatFileSize(1024 * 1024 * 1024) // "1GB"
 */
export function formatFileSize(size: number): string {
  if (size < 1024)
    return `${size} B`;
  else if (size < 1024 * 1024)
    return `${(size / 1024).toFixed(2)} KB`;
  else if (size < 1024 * 1024 * 1024)
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  else
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}


/**
 * https://segmentfault.com/a/1190000044342886
 * 下载文件
 * @param url 下载地址
 * @param fileName 下载后的文件名
 * @param callback 下载进度回调函数
 * @returns 下载进度对象
 */
export function downloadFile(url: string, fileName: string, callback?: (progress: number) => void) {
  const progress = ref(0);
  let writer: WritableStreamDefaultWriter<Uint8Array>;
  // 【步骤1】创建一个文件，该文件支持写入操作
  const fileStream = streamSaver.createWriteStream(fileName); // 这里传入的是下载后的文件名，这个名字可以自定义
  // 【步骤2】使用 fetch 方法访问文件的url，将内容一点点的放到 StreamSaver 创建的文件里
  fetch(url)
    .then((res) => {
      const stream = res.body;
      if (!stream)
        return;

      if (window.WritableStream && stream.pipeTo) {
        return stream.pipeTo(fileStream)
          .then(() => {
            if (typeof callback === "function")
              callback(1);
            progress.value = 1;
          });
      }
      // 【步骤3】监听文件内容是否读取完整，读取完就执行“保存并关闭文件”的操作。
      writer = fileStream.getWriter();
      const reader = stream.getReader();
      const pump: () => void = () => reader.read()
        .then(res => res.done
          ? writer.close()
          : writer.write(res.value).then(pump),
        );
      // 【步骤4】监听写入进度
      pump();
    });

  return {
    progress,
  };
}
