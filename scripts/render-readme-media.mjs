// Compose the capture into an 18-second MP4, poster, and lightweight GIF previews.
// Run after capture-readme.mjs. ffmpeg and ffprobe must be on PATH.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const scratch = resolve(tmpdir(), 'dimsumdev-capture');
const out = resolve(root, 'docs/images');
const videos = resolve(root, 'docs/videos');
await mkdir(videos, { recursive: true });
function run(program, args, timeout = 120000) {
  const r = spawnSync(program, args, { encoding: 'utf8', timeout, maxBuffer: 1024 * 1024 });
  if (r.error || r.status !== 0) throw Error(`${program}: ${r.error?.message ?? r.stderr}`);
  return r.stdout;
}
const marks = JSON.parse(await readFile(resolve(scratch, 'capture.json'), 'utf8'));
const source = resolve(scratch, 'source.webm');
const info = JSON.parse(run('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', source]));
// Playwright starts recording on the first browser frame. Align the final cue to
// the end of the recording rather than including the page's initial blank frame.
const offset = Number(info.format.duration) - marks.durationMs / 1000;
// An optional sourceCuts array holds visually reviewed source-frame times.
const chapters = marks.chapters.map((m, i) => ({ ...m, source: marks.sourceCuts?.[i] ?? offset + m.at / 1000 }));
const lengths = [3.5, 4.5, 8, 2];
let segments = chapters.map((m, i) => ({
  start: m.source,
  duration: (chapters[i + 1]?.source ?? Number(info.format.duration)) - m.source,
  target: lengths[i],
}));
if (chapters.map(c => c.label).join() !== 'global,agent,walk,end') throw Error('Capture is missing a chapter');
if (marks.walkShots?.length === 3) {
  const shots = marks.walkShots.map((s, i) => {
    const start = s.sourceStart ?? offset + s.startMs / 1000;
    const end = s.sourceEnd ?? offset + s.endMs / 1000;
    return { start, duration: end - start, target: [2.6, 2.6, 2.8][i] };
  });
  segments = [segments[0], segments[1], ...shots, segments[3]];
}

// An original, quiet electronic bed: soft pentatonic plucks, kick and hats.
// No downloaded music, samples or licensing requirements.
const rate = 48000, duration = 18, pcm = Buffer.alloc(rate * duration * 2);
const notes = [220, 329.628, 440, 493.883, 329.628, 293.665, 440, 587.33];
for (let n = 0; n < rate * duration; n++) {
  const t = n / rate, step = .25, hit = Math.floor(t / step), a = t % step;
  const freq = notes[hit % notes.length];
  const pluck = .075 * Math.exp(-a * 18) * (Math.sin(2 * Math.PI * freq * a) + .25 * Math.sin(4 * Math.PI * freq * a));
  const beat = t % .5;
  const kick = .09 * Math.exp(-beat * 25) * Math.sin(2 * Math.PI * (48 * beat + 2.5 * (1 - Math.exp(-beat * 30))));
  const hat = .014 * Math.exp(-a * 90) * Math.sin(n * n * .13);
  const fade = Math.min(1, t / .12, (duration - t) / .8);
  pcm.writeInt16LE(Math.round(Math.tanh((pluck + kick + hat) * fade * 2.8) * 32767), n * 2);
}
const header = Buffer.alloc(44);
header.write('RIFF'); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8);
header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
header.writeUInt32LE(rate, 24); header.writeUInt32LE(rate * 2, 28); header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
const audio = resolve(scratch, 'original-bed.wav');
await writeFile(audio, Buffer.concat([header, pcm]));

const text = (copy, x, y, size, color = 'f6f4e9', extra = '') =>
  `drawtext=font='DejaVu Sans':text='${copy}':x=${x}:y=${y}:fontsize=${size}:fontcolor=0x${color}${extra}`;
const captions = [
  'See the whole team. Instantly.',
  'Open a panda. Follow the conversation.',
  'Step inside. Walk up to your team.',
  'Your agents. One living world.',
];
const bands = [0, 3.5, 8, 16, 18];
const styling = [
  'crop=1528:692:36:224', 'scale=1760:798:flags=lanczos',
  'pad=1920:1080:80:158:color=0x122920',
  text('DimSumDev', 80, 38, 54),
  text('A living world for your AI dev team.', 435, 57, 23, 'bacaaf'),
  text('LOCAL FIRST   /   HUMAN IN CONTROL', 80, 111, 14, 'bacaaf'),
  text('PRODUCT DEMO  /  18 SECONDS', 1532, 117, 12, 'bacaaf'),
  ...captions.map((c, i) => text(c, 80, 986, 34, 'f6f4e9', `:enable='gte(t,${bands[i]})*lt(t,${bands[i+1]})'`)),
  ...['01   GLOBAL VIEW', '02   AGENT CONVERSATION', '03   ENTER THE DEN', 'DIMSUMDEV'].map((c,i) =>
    text(c, 1350, 62, 20, 'edc77d', `:enable='gte(t,${bands[i]})*lt(t,${bands[i+1]})'`)),
  text('Demo fixture - recorded and staged events', 80, 1044, 12, 'bacaaf'),
  ...[0, 1, 2].map(i => `drawbox=x=${1350+i*164}:y=1002:w=148:h=4:color=0x4a6150:t=fill`),
  ...[0, 1, 2].map(i => `drawbox=x=${1350+i*164}:y=1002:w=148:h=4:color=0xedc77d:t=fill:enable='gte(t,${bands[i]})'`),
  'setsar=1', 'format=yuv420p',
].join(',');
const graph = [
  `[0:v]split=${segments.length}${segments.map((_, i) => `[s${i}]`).join('')}`,
  ...segments.map((s,i) => `[s${i}]trim=start=${s.start.toFixed(3)}:duration=${s.duration.toFixed(3)},setpts=(PTS-STARTPTS)*${(s.target/s.duration).toFixed(6)},fps=30,tpad=stop_mode=clone:stop_duration=1,trim=duration=${s.target}[v${i}]`),
  segments.map((_, i) => `[v${i}]`).join('') + `concat=n=${segments.length}:v=1:a=0,setsar=1,` + styling + '[video]',
].join(';');
const movie = resolve(videos, 'dimsumdev-linkedin.mp4');
run('ffmpeg', ['-y','-hide_banner','-loglevel','error','-i',source,'-i',audio,
  '-filter_complex',graph,'-map','[video]','-map','1:a','-t','18',
  '-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p',
  '-c:a','aac','-b:a','160k','-movflags','+faststart', movie]);
run('ffmpeg', ['-y','-hide_banner','-loglevel','error','-i',resolve(out,'dimsumdev-overview.png'),'-vf',styling,'-frames:v','1',resolve(out,'dimsumdev-preview.png')]);
const gif = (start, seconds, width, fps, name) => {
  run('ffmpeg', ['-y','-hide_banner','-loglevel','error','-ss',String(start),'-t',String(seconds),'-i',movie,
    '-filter_complex',`fps=${fps},scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle`,
    '-loop','0',resolve(out,name)]);
};
gif(0,18,960,10,'dimsumdev-preview.gif');
gif(8,8,960,10,'dimsumdev-walk.gif');
await writeFile(resolve(scratch, 'edit.json'), JSON.stringify({ offset, segments, output: movie }, null, 2) + '\n');
console.log(`Rendered ${movie}; poster and GIFs in ${out}`);
