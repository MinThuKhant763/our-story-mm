"""Generate OurStory's original synthetic ambient WAV loops (Python standard library)."""
from pathlib import Path
import math,array,wave,hashlib,json
root=Path(__file__).resolve().parents[1]
rate=22050;duration=16;n=rate*duration
tracks=[('tender-keys',[60,64,67,71],[0,4,7,12],1.6),('moonlit-dream',[57,60,64,67],[0,7,12,4],2.5),('garden-chimes',[65,69,72,76],[12,7,4,0],1.1)]
folder=root/'public'/'audio';folder.mkdir(parents=True,exist_ok=True)
records=[]
for name,chord,pattern,decay in tracks:
 data=[0.0]*n
 for beat in range(16):
  midi=chord[pattern[beat%4]//4%4]+(12 if name=='garden-chimes' else 0)
  frequency=440*2**((midi-69)/12)
  start=beat*rate
  for j in range(int(rate*4)):
   t=j/rate;envelope=min(1,t/.02)*math.exp(-t/decay)
   tone=math.sin(2*math.pi*frequency*t)+.22*math.sin(4*math.pi*frequency*t)+.07*math.sin(6*math.pi*frequency*t)
   data[(start+j)%n]+=tone*envelope
 # Quiet sustained harmony is also periodic across the loop boundary.
 for j in range(n):
  for midi in chord[:3]:
   cycles=round(440*2**((midi-81)/12)*duration)
   data[j]+=.08*math.sin(2*math.pi*cycles*j/n)
 peak=max(abs(v) for v in data)
 pcm=array.array('h',(int(v/peak*.65*32767*min(1,j/(rate*.01),(n-1-j)/(rate*.01))) for j,v in enumerate(data)))
 import sys
 if sys.byteorder!='little':pcm.byteswap()
 path=folder/(name+'.wav')
 with wave.open(str(path),'wb') as out:out.setnchannels(1);out.setsampwidth(2);out.setframerate(rate);out.writeframes(pcm.tobytes())
 records.append({'path':str(path.relative_to(root)),'seconds':duration,'sampleRate':rate,'channels':1,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
(root/'docs'/'SOUNDTRACK_PROVENANCE.json').write_text(json.dumps({'description':'Original procedural synthesis for this project; no sampled recordings or downloaded songs.','generator':'scripts/generate-soundtracks.py','tracks':records},indent=2)+'\n')
print('Generated three original 16-second ambient loops.')
