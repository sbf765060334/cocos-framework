import Tool from "../../util/Tool";

const { ccclass, property, disallowMultiple } = cc._decorator;

/**
 * 弹窗基类
 */
@ccclass
@disallowMultiple
export default class DialogBase extends cc.Component {
    /** 弹窗prefab在resources/prefab/dialog/下的路径 */
    public static pUrl: string = '';

    @property(cc.Animation)
    public DlgAnim: cc.Animation = null;

    @property({
        type: cc.AnimationClip,
        tooltip: CC_DEV && '打开弹窗的动画',
        visible() { return !!this.DlgAnim; }
    })
    public OpenClip: cc.AnimationClip = null;

    @property({
        type: cc.AnimationClip,
        tooltip: CC_DEV && '关闭弹窗的动画',
        visible() { return !!this.DlgAnim; }
    })
    public CloseClip: cc.AnimationClip = null;

    /** 外部的resolve函数，在弹窗close时调用 */
    private _resolveList: Array<(value?: any) => void> = [];

    protected onLoad() {
        if (this.DlgAnim) {
            this.OpenClip && this.DlgAnim.addClip(this.OpenClip);
            this.CloseClip && this.DlgAnim.addClip(this.CloseClip);
            this.DlgAnim.on(cc.Animation.EventType.FINISHED, this.onAnimFinished, this);
        }
    }

    protected onAnimFinished() {
        if (this.DlgAnim.currentClip === this.CloseClip) {
            this.close();
        }
    }

    /**
     * 打开动画
     */
    public playOpen() {
        if (this.DlgAnim && this.OpenClip) {
            this.DlgAnim.play(this.OpenClip.name);
        }
    }

    /**
     * 关闭动画
     */
    public playClose() {
        if (this.DlgAnim && this.CloseClip) {
            this.DlgAnim.play(this.CloseClip.name);
        } else {
            this.close();
        }
    }

    /**
     * @virtual
     * 打开弹窗
     */
    public open(...args: any[]): any {
    }

    /**
     * @virtual
     * 关闭弹窗，必须调用此接口关闭，子类重写时请调用super.close()
     */
    public close(...args: any[]): any {
        this._resolveList.forEach((resolve) => { resolve(); });
        this.node.removeFromParent();
        this.node.destroy();
    }

    /**
     * @virtual
     * 关闭按钮回调
     */
    protected onClickClose() {
        this.DlgAnim ? this.playClose() : this.close();
    }

    /**
     * 添加外部resolve函数，在弹窗close时调用
     */
    public addResolve(resolve: (value?: any) => void) {
        Tool.arrayAdd(this._resolveList, resolve);
    }
}
