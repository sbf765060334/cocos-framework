import { EventName } from "../../const/EventName";
import { DirUrl, ResUrl } from "../../const/Url";
import Events from "../../util/Events";
import Res from "../../util/Res";
import Tool from "../../util/Tool";
import DialogBase from "./DialogBase";
import Timer from "./Timer";
import Tip from "./Tip";

const { ccclass, property, disallowMultiple, menu } = cc._decorator;

/**
 * tip数据
 */
export interface TipData {
    /** 文字内容 */
    text: string;
    /** 此条文字是否唯一显示 */
    unique?: boolean;
    /** 存在时间 单位s */
    duration?: number;
    /** 消失时的渐隐时间 单位s */
    fade?: number;
    /** 初始位置 */
    start?: cc.Vec2;
    /** 渐隐过程终点位置 */
    end?: cc.Vec2;
}

/**
 * 全局层级管理
 */
@ccclass
@disallowMultiple
@menu('Framework/基础组件/Layer')
export default class Layer extends cc.Component {
    public static inst: Layer = null;

    @property(cc.Node) public MainLayer: cc.Node = null;
    @property(cc.Node) public DialogLayer: cc.Node = null;
    @property(cc.Node) public LoadingLayer: cc.Node = null;
    @property(cc.Node) public TipLayer: cc.Node = null;

    /** 打开Loading层计数，为0时关闭，防止某些情况同时触发打开关闭Loading */
    private _loadingCount: number = 0;
    /** tip节点池 */
    private _tipPool: cc.Node[] = [];
    /** 当前存在的tip文字数组 */
    private _tipTexts: string[] = [];

    protected onLoad() {
        Layer.inst = this;
        this.hideLoading();
    }

    protected onDestroy() {
        Layer.inst = null;
    }

    /**
     * 获取文件名（截取url最后一个斜杠后的内容）
     */
    public getNameByUrl(url: string) {
        return url.substring(url.lastIndexOf('/') + 1, url.length);
    }

    /**
     * 进入主界面
     */
    public enterHome() {
        Timer.reset();
        cc.Camera.main.node.position = cc.v3(0, 0);
        Events.emit(EventName.CAMERA_MOVE);

        this.MainLayer.destroyAllChildren();
        this.DialogLayer.destroyAllChildren();
        this.TipLayer.destroyAllChildren();
        let node: cc.Node = cc.instantiate(Res.get(ResUrl.PREFAB.HOME, cc.Prefab));
        node.setPosition(0, 0);
        this.MainLayer.addChild(node);
        return node;
    }

    /**
     * 进入游戏界面
     */
    public enterGame() {
        this.MainLayer.destroyAllChildren();
        this.DialogLayer.destroyAllChildren();
        this.TipLayer.destroyAllChildren();
        let node: cc.Node = cc.instantiate(Res.get(ResUrl.PREFAB.GAME, cc.Prefab));
        node.setPosition(0, 0);
        this.MainLayer.addChild(node);
        return node;
    }

    /**
     * 获取弹窗组件（返回遍历到的第一个）
     * @param url prefab在resources/prefab/dialog/下的路径
     */
    public getDialog(url: string): DialogBase {
        for (let i = 0; i < this.DialogLayer.childrenCount; i++) {
            let node = this.DialogLayer.children[i];
            let cmpt = node.getComponent(DialogBase);
            if (!cmpt) {
                continue;
            }
            if (cmpt.constructor['pUrl'] === url) {
                return cmpt;
            }
        }
        return null;
    }

    /**
     * （同步方法，需确保事先已加载预制资源）打开弹窗
     * @param url prefab在resources/prefab/dialog/下的路径
     * @param args DialogBase.open调用参数
     */
    public openDialog(url: string, ...args: any[]) {
        let prefab: cc.Prefab = Res.get(DirUrl.PREFAB_DIALOG + url, cc.Prefab);
        if (!prefab) {
            cc.error(`[Layer.openDialog] can not find dialog prefab: ${DirUrl.PREFAB_DIALOG + url}`);
            return;
        }

        let node = cc.instantiate(prefab);
        this.DialogLayer.addChild(node);
        node.setPosition(0, 0);
        let cmpt = node.getComponent(DialogBase);
        if (cmpt) {
            cmpt.playOpen();
            cmpt.open(...args);
        }
    }

    /**
     * （同步方法，需确保事先已加载预制资源）打开唯一弹窗--同一弹窗节点只能同时存在一个
     * @param url prefab在resources/prefab/dialog/下的路径
     * @param args DialogBase.open调用参数
     */
    public openUniDialog(url: string, ...args: any[]) {
        if (this.getDialog(url)) {
            return;
        }

        this.openDialog(url, ...args);
    }

    /**
     * 打开弹窗
     * @async
     * @param url prefab在resources/prefab/dialog/下的路径
     * @param args DialogBase.open调用参数
     */
    public async openDialogAsync(url: string, ...args: any[]) {
        this.showLoading();
        let prefab: cc.Prefab = await Res.load(DirUrl.PREFAB_DIALOG + url, cc.Prefab);
        this.hideLoading();
        if (!prefab) {
            cc.error(`[Layer.openDialogAsync] can not find dialog prefab: ${DirUrl.PREFAB_DIALOG + url}`);
            return;
        }

        let node = cc.instantiate(prefab);
        this.DialogLayer.addChild(node);
        node.setPosition(0, 0);
        let cmpt = node.getComponent(DialogBase);
        if (cmpt) {
            cmpt.playOpen();
            cmpt.open(...args);
        }
    }

    /**
     * 打开唯一弹窗--同一弹窗节点只能同时存在一个
     * @async
     * @param url prefab在resources/prefab/dialog/下的路径
     * @param args DialogBase.open调用参数
     */
    public async openUniDialogAsync(url: string, ...args: any[]) {
        if (this.getDialog(url)) {
            return;
        }

        await this.openDialogAsync(url, ...args);
    }

    /**
     * 关闭遍历到的第一个弹窗
     * @param url prefab在resources/prefab/dialog/下的路径
     * @param args
     */
    public closeDialog(url: string, ...args: any[]) {
        let cmpt = this.getDialog(url);
        cmpt && cmpt.close(...args);
    }

    /**
     * 关闭所有弹窗
     * @param url prefab在resources/prefab/dialog/下的路径
     * @param args
     */
    public closeDialogs(url: string, ...args: any[]) {
        for (let i = 0; i < this.DialogLayer.childrenCount; i++) {
            let node = this.DialogLayer.children[i];
            let cmpt = node.getComponent(DialogBase);
            if (!cmpt) {
                continue;
            }
            if (cmpt.constructor['pUrl'] === url) {
                cmpt.close(...args);
            }
        }
    }

    /**
     * 异步等待弹窗关闭（只等待遍历到的第一个）
     * @param url prefab在resources/prefab/dialog/下的路径
     */
    public async waitCloseDialog(url: string) {
        let cmpt = this.getDialog(url);
        if (!cmpt) {
            return;
        }
        return await new Promise((resolve, reject) => {
            cmpt.addResolve(resolve);
        });
    }

    /**
     * 异步等待所有弹窗关闭
     * @param url prefab在resources/prefab/dialog/下的路径
     */
    public async waitCloseDialogs(url: string) {
        let arr: Array<Promise<any>> = [];
        for (let i = 0; i < this.DialogLayer.childrenCount; i++) {
            let node = this.DialogLayer.children[i];
            let cmpt = node.getComponent(DialogBase);
            if (!cmpt) {
                continue;
            }
            if (cmpt.constructor['pUrl'] === url) {
                arr.push(new Promise((resolve, reject) => {
                    cmpt.addResolve(resolve);
                }));
            }
        }
        return await Promise.all(arr);
    }

    /**
     * 弹出一条文字提示
     * @param data TipData | string 提示数据
     */
    public async showTip(data: TipData | string) {
        // 处理tipData默认值
        let tipData: TipData = null;
        if (typeof data === 'string') {
            tipData = {
                text: data
            };
        } else {
            tipData = data;
        }
        if (!tipData.hasOwnProperty('unique')) {
            tipData.unique = false;
        }
        if (!tipData.hasOwnProperty('duration')) {
            tipData.duration = 1;
        }
        if (!tipData.hasOwnProperty('fade')) {
            tipData.fade = 0.5;
        }
        if (!tipData.hasOwnProperty('start')) {
            tipData.start = cc.v2(0, 0);
        }
        if (!tipData.hasOwnProperty('end')) {
            tipData.end = cc.v2(0, 0);
        }

        // 唯一显示
        if (tipData.unique && Tool.arrayHas(this._tipTexts, tipData.text)) {
            return;
        }
        this._tipTexts.push(tipData.text);

        // 获取节点
        let tipNode: cc.Node = null;
        if (this._tipPool.length > 0) {
            tipNode = this._tipPool.shift();
        } else {
            let prefab: cc.Prefab = await Res.load(ResUrl.PREFAB.TIP, cc.Prefab);
            if (!prefab) {
                cc.error(`[Layer.showTip] can not load prefab: ${ResUrl.PREFAB.TIP}`);
                return;
            }
            tipNode = cc.instantiate(prefab);
            this.TipLayer.addChild(tipNode);
        }

        // 动画
        let delay = cc.delayTime(tipData.duration);
        let fade = cc.fadeOut(tipData.fade);
        let moveTo = cc.moveTo(tipData.fade, tipData.end);
        let call = cc.callFunc(() => {
            tipNode.active = false;
            this._tipPool.push(tipNode);
            Tool.arrayDelete(this._tipTexts, tipData.text);
        });
        tipNode.active = true;
        tipNode.opacity = 255;
        tipNode.setPosition(tipData.start);
        tipNode.setSiblingIndex(this.TipLayer.childrenCount - 1);
        tipNode.runAction(cc.sequence(delay, cc.spawn(fade, moveTo), call));

        // 数据
        tipNode.getComponent(Tip)?.init(tipData.text);
    }

    /**
     * 清空所有弹窗与提示
     */
    public clearDialogAndTip() {
        this._tipPool.length = 0;
        this._tipTexts.length = 0;
        this.DialogLayer.destroyAllChildren();
        this.TipLayer.destroyAllChildren();
    }

    /**
     * 打开全局loading遮罩（打开与关闭的调用必须一一对应）
     */
    public showLoading() {
        this._loadingCount++;
        this.LoadingLayer.active = true;
    }

    /**
     * 关闭全局loading遮罩
     */
    public hideLoading() {
        this._loadingCount--;
        if (this._loadingCount <= 0) {
            this._loadingCount = 0;
            this.LoadingLayer.active = false;
        }
    }
}
