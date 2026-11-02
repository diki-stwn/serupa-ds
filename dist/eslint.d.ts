/** What each Serupa component renders, under eslint-plugin-jsx-a11y's settings ("jsx-a11y") and its fork's ("jsx-a11y-x"). */
export interface SerupaA11ySettings {
  /** Each component's name and the element it renders: Image is "img", Link is "a". */
  components: Record<string, string>;
  /** The prop that changes the element a component renders. */
  polymorphicPropName: "as";
}
/** The props that name a control, for control-has-associated-label's labelAttributes. */
export declare const labelAttributes: string[];
/** An ESLint flat-config object: put it in your eslint.config.js array, after the jsx-a11y config. */
declare const config: { name: string; settings: { "jsx-a11y": SerupaA11ySettings; "jsx-a11y-x": SerupaA11ySettings } };
export default config;
