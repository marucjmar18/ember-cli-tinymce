/* global tinymce: true */
import Ember from 'ember';
const { observer, on, run } = Ember;

export default Ember.Component.extend({
  editor: null,
  classNames: ['tinymce-editor'],
  tagName: 'textarea',
  _contentChangedListener: null,
  changeDebounce: 10,
  options: {},
  initDefer: null,

  valueChanged: observer('value', function() {
    let {editor, value} = this.getProperties('editor', 'value');
    if (editor && editor.getContent() !== value) {
      editor.setContent(value || '');
    }
  }),

  onValueChanged(value) {
    this.set('value', value);
  },

  contentChanged(editor) {
    let content = editor.getContent();
    if (editor.isDirty() && content !== this.get('value')) {
      this.onValueChanged(editor.getContent());
      editor.setDirty(true);
    }
  },

  debounceContentChanged(editor, time){
    run.debounce(this, this.contentChanged, editor, time);
  },

  setEvents: observer('editor', function() {
    let {changeDebounce, editor} = this.getProperties('changeDebounce', 'editor');

    if (!editor){
      return;
    }

    editor.on('change keyup keydown keypress mousedown',
              run.bind(this, this.debounceContentChanged, editor, changeDebounce));
  }),

  initTiny: on('didInsertElement', observer('options', function() {
    let {options, editor} = this.getProperties('options', 'editor');

    let initFunction = (editor) => {
      if (this.get('isDestroying') || this.get('isDestroyed')) { return; }
      if (!editor) { return; }
      this.set('editor', editor);
      this.get('editor').setContent(this.get('value') || ''); //Set content with default text
    };

    let customOptions = {
      selector: `#${this.get('elementId')}`,
      init_instance_callback: run.bind(this, initFunction)
    };

    if (editor){
      this.cancelInitDefer();
      editor.setContent('');
      editor.destroy();
    }

    const defer = run.later(() => {
      if (this.get('isDestroying') || this.get('isDestroyed')) { return; }
      if (typeof tinymce === 'undefined') { return; }
      tinymce.init(Ember.assign({}, options, customOptions));
    }, 10);

    this.set('defer', defer);
  })),

  cleanUp: on('willDestroyElement', function() {
    this.cancelInitDefer();

    let editor = this.get('editor');
    if (editor) {
      editor.off('change keyup keydown keypress mousedown');
      editor.destroy();
    }
  }),

  cancelInitDefer() {
    const initDefer = this.get('initDefer');

    if (initDefer) {
      run.cancel(initDefer);
    }
  }
});
