
import { type VideoItem } from '@/app-ui/common/types';
import { toRaw } from 'vue';
import { getPlatformAdapter } from '@/app-ui/adapters';

export const openLocalFile = async (videoList: VideoItem[]):Promise<VideoItem[]> => {
    console.log('打开本地文件', videoList);
    const filePaths = await getPlatformAdapter().media.openFiles(toRaw(videoList));
    return filePaths as VideoItem[];
}

export const importDroppedFiles = async (
    files: File[],
    videoList: VideoItem[]
): Promise<VideoItem[]> => {
    const filePaths = files
        .map(file => getPlatformAdapter().media.getPathForFile(file))
        .filter(Boolean)
    return await getPlatformAdapter().media.importDroppedFiles(filePaths, toRaw(videoList)) as VideoItem[]
}

// export const localStore = async (key: string): Promise<any> => {
//     console.log('获取本地存储数据');
//     return await window.electron.ipcRenderer.invoke('store:get', key);
// }

export const localStore = async (type: 'get' | 'set', _key: 'videoList', value?: VideoItem[]): Promise<VideoItem[] | void> => {
    if(type === 'get'){
        return getPlatformAdapter().storage.getVideoList();
    }else if(type === 'set'){
        console.log('设置本地存储数据', value);
        if (!value) throw new Error('videoList is required')
        await getPlatformAdapter().storage.setVideoList(value);
    }
}
