const { ccclass, property, menu, disallowMultiple } = cc._decorator;

/**
 * 分辨率适配组件，保证设计分辨率区域全部都能显示
 */
@ccclass
@disallowMultiple
@menu('Framework/UI组件/AdaptCanvas')
export default class AdaptCanvas extends cc.Component {
    protected onLoad() {
        this.adapt();
        // 仅web有效
        cc.view.setResizeCallback(() => {
            this.adapt();
        });
    }

    private adapt() {
        let resolutionRatio = cc.Canvas.instance.designResolution.width / cc.Canvas.instance.designResolution.height;
        let ratio = cc.winSize.width / cc.winSize.height;
        if (ratio > resolutionRatio) {
            cc.Canvas.instance.fitHeight = true;
            cc.Canvas.instance.fitWidth = false;
        } else {
            cc.Canvas.instance.fitHeight = false;
            cc.Canvas.instance.fitWidth = true;
        }
    }
}
