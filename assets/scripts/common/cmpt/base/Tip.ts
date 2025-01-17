const { ccclass, property, disallowMultiple } = cc._decorator;

@ccclass
@disallowMultiple
export default class Tip extends cc.Component {

    @property(cc.Layout) public Layout: cc.Layout = null;
    @property(cc.Label) public TextLab: cc.Label = null;

    public init(text: string) {
        this.TextLab.string = text;
        this.TextLab['_forceUpdateRenderData']();
        this.Layout.updateLayout();
    }
}
