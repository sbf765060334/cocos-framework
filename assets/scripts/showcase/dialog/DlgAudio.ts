import DialogBase from "../../common/cmpt/base/DialogBase";
import { ResUrl } from "../../common/const/Url";
import AudioManager, { SfxType } from "../../common/util/AudioManager";
import Res from "../../common/util/Res";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DlgAudio extends DialogBase {
    public static pUrl: string = 'DlgAudio';

    @property(cc.Slider) public VolumeSlider: cc.Slider = null;

    /**
     * @override
     */
    public open() {
        this.onSlide();
    }

    /**
     * @override
     */
    public close() {
        super.close();
        AudioManager.stopAll();
    }

    private onSlide() {
        AudioManager.bgmVolume = this.VolumeSlider.progress;
        AudioManager.sfxVolume = this.VolumeSlider.progress;
    }

    private onClickBgm1FadeIn() {
        AudioManager.playBgm({ clip: Res.get(ResUrl.AUDIO.BGM1, cc.AudioClip), fadeDuration: 5 });
    }

    private onClickBgm1OutBgm2In() {
        AudioManager.stopBgm(Res.get(ResUrl.AUDIO.BGM1, cc.AudioClip), 5);
        AudioManager.playBgm({ clip: Res.get(ResUrl.AUDIO.BGM2, cc.AudioClip), fadeDuration: 5 });
    }

    private onClickBgmFadeOut() {
        AudioManager.stopBgm(Res.get(ResUrl.AUDIO.BGM1, cc.AudioClip), 5);
        AudioManager.stopBgm(Res.get(ResUrl.AUDIO.BGM2, cc.AudioClip), 5);
    }

    // 即使多次点击按钮，此音效也始终只会同时播放一个
    private onClickSfx1() {
        AudioManager.setSfxData(Res.get<cc.AudioClip>(ResUrl.AUDIO.SFX1, cc.AudioClip), SfxType.NORMAL, 1, false);
        AudioManager.playSfx(Res.get<cc.AudioClip>(ResUrl.AUDIO.SFX1, cc.AudioClip), SfxType.NORMAL);
    }

    // 此音效最多同时播放五个
    private onClickSfx2() {
        AudioManager.setSfxData(Res.get<cc.AudioClip>(ResUrl.AUDIO.SFX2, cc.AudioClip), SfxType.NORMAL, 5, false);
        AudioManager.playSfx(Res.get<cc.AudioClip>(ResUrl.AUDIO.SFX2, cc.AudioClip), SfxType.NORMAL);
    }
}
