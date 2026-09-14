import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffporbePath from 'ffprobe-static';
import type { VideoItem } from '../../src/app-ui/common/types';
import { resolvePackagedBinaryPath } from './media-binary-path';
// import path from 'path';

/**
 * ffmpeg 工具类,获取视频元数据
 */

// 设置 ffmpeg 和 ffprobe 的路径
ffmpeg.setFfmpegPath(resolvePackagedBinaryPath(ffmpegPath!));
ffmpeg.setFfprobePath(resolvePackagedBinaryPath(ffporbePath.path));

//分析单个视频文件的元数据
export const analyzeSingleVideo = async (filePath:string): Promise<NonNullable<VideoItem['meta']>> => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);
  
            const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
            const vCodec = videoStream?.codec_name || '';
            const result: NonNullable<VideoItem['meta']> = {
                vCodec,
                duration: metadata.format.duration ?? 0,
            };
            if (videoStream?.width && videoStream.height) {
                result.resolution = `${videoStream.width}x${videoStream.height}`;
            }
            if (typeof metadata.format.size === 'number') {
                result.size = metadata.format.size;
            }
            // const ext = path.extname(filePath).toLowerCase();

            // const isNative = vCodec === 'h264' && ext === '.mp4'; // 判断是否为原生格式
            resolve(result);
        });
    });
}
