"use strict";

/*
 * MikoPBX - free phone system for small business
 * Copyright (C) 2017-2020 Alexey Portnov and Nikolay Beketov
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program.
 * If not, see <https://www.gnu.org/licenses/>.
 */

/* global globalRootUrl,globalTranslate, ace, Form, Extensions */
// Проверка нет ли ошибки занятого другой учеткой номера
$.fn.form.settings.rules.existRule = function (value, parameter) {
  return $("#".concat(parameter)).hasClass('hidden');
};

var dialplanApplication = {
  $number: $('#extension'),
  defaultExtension: '',
  $formObj: $('#dialplan-application-form'),
  $typeSelectDropDown: $('#dialplan-application-form .type-select'),
  $dirrtyField: $('#dirrty'),
  $tabMenuItems: $('#application-code-menu .item'),
  editor: '',
  validateRules: {
    name: {
      identifier: 'name',
      rules: [{
        type: 'empty',
        prompt: globalTranslate.da_ValidateNameIsEmpty
      }]
    },
    extension: {
      identifier: 'extension',
      rules: [{
        type: 'regExp',
        value: '/^(|[0-9#+\\*|X]{1,64})$/',
        prompt: globalTranslate.da_ValidateExtensionNumber
      }, {
        type: 'empty',
        prompt: globalTranslate.da_ValidateExtensionIsEmpty
      }, {
        type: 'existRule[extension-error]',
        prompt: globalTranslate.da_ValidateExtensionDouble
      }]
    }
  },
  initialize: function () {
    function initialize() {
      dialplanApplication.$tabMenuItems.tab();

      if (dialplanApplication.$formObj.form('get value', 'name').length === 0) {
        dialplanApplication.$tabMenuItems.tab('change tab', 'main');
      }

      dialplanApplication.$typeSelectDropDown.dropdown({
        onChange: dialplanApplication.changeAceMode
      }); // Динамическая проверка свободен ли внутренний номер

      dialplanApplication.$number.on('change', function () {
        var newNumber = dialplanApplication.$formObj.form('get value', 'extension');
        Extensions.checkAvailability(dialplanApplication.defaultExtension, newNumber);
      });
      dialplanApplication.initializeForm();
      dialplanApplication.initializeAce();
      dialplanApplication.changeAceMode();
      dialplanApplication.defaultExtension = dialplanApplication.$formObj.form('get value', 'extension');
    }

    return initialize;
  }(),
  initializeAce: function () {
    function initializeAce() {
      var applicationLogic = dialplanApplication.$formObj.form('get value', 'applicationlogic');
      var aceHeight = window.innerHeight - 380;
      var rowsCount = Math.round(aceHeight / 16.3);
      $(window).load(function () {
        $('.application-code').css('min-height', "".concat(aceHeight, "px"));
      });
      dialplanApplication.editor = ace.edit('application-code');
      dialplanApplication.editor.getSession().setValue(applicationLogic);
      dialplanApplication.editor.setTheme('ace/theme/monokai');
      dialplanApplication.editor.resize();
      dialplanApplication.editor.getSession().on('change', function () {
        dialplanApplication.$dirrtyField.val(Math.random());
        dialplanApplication.$dirrtyField.trigger('change');
      });
      dialplanApplication.editor.setOptions({
        maxLines: rowsCount,
        showPrintMargin: false,
        showLineNumbers: false
      });
    }

    return initializeAce;
  }(),
  changeAceMode: function () {
    function changeAceMode() {
      var mode = dialplanApplication.$formObj.form('get value', 'type');
      var NewMode;

      if (mode === 'php') {
        NewMode = ace.require('ace/mode/php').Mode;
        dialplanApplication.editor.setOptions({
          showLineNumbers: true
        });
      } else {
        NewMode = ace.require('ace/mode/julia').Mode;
        dialplanApplication.editor.setOptions({
          showLineNumbers: false
        });
      }

      dialplanApplication.editor.session.setMode(new NewMode());
      dialplanApplication.editor.setTheme('ace/theme/monokai');
    }

    return changeAceMode;
  }(),
  cbBeforeSendForm: function () {
    function cbBeforeSendForm(settings) {
      var result = settings;
      result.data = dialplanApplication.$formObj.form('get values');
      result.data.applicationlogic = dialplanApplication.editor.getValue();
      return result;
    }

    return cbBeforeSendForm;
  }(),
  cbAfterSendForm: function () {
    function cbAfterSendForm() {}

    return cbAfterSendForm;
  }(),
  initializeForm: function () {
    function initializeForm() {
      Form.$formObj = dialplanApplication.$formObj;
      Form.url = "".concat(globalRootUrl, "dialplan-applications/save");
      Form.validateRules = dialplanApplication.validateRules;
      Form.cbBeforeSendForm = dialplanApplication.cbBeforeSendForm;
      Form.cbAfterSendForm = dialplanApplication.cbAfterSendForm;
      Form.initialize();
    }

    return initializeForm;
  }()
};
$(document).ready(function () {
  dialplanApplication.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9EaWFscGxhbkFwcGxpY2F0aW9ucy9kaWFscGxhbi1hcHBsaWNhdGlvbnMtbW9kaWZ5LmpzIl0sIm5hbWVzIjpbIiQiLCJmbiIsImZvcm0iLCJzZXR0aW5ncyIsInJ1bGVzIiwiZXhpc3RSdWxlIiwidmFsdWUiLCJwYXJhbWV0ZXIiLCJoYXNDbGFzcyIsImRpYWxwbGFuQXBwbGljYXRpb24iLCIkbnVtYmVyIiwiZGVmYXVsdEV4dGVuc2lvbiIsIiRmb3JtT2JqIiwiJHR5cGVTZWxlY3REcm9wRG93biIsIiRkaXJydHlGaWVsZCIsIiR0YWJNZW51SXRlbXMiLCJlZGl0b3IiLCJ2YWxpZGF0ZVJ1bGVzIiwibmFtZSIsImlkZW50aWZpZXIiLCJ0eXBlIiwicHJvbXB0IiwiZ2xvYmFsVHJhbnNsYXRlIiwiZGFfVmFsaWRhdGVOYW1lSXNFbXB0eSIsImV4dGVuc2lvbiIsImRhX1ZhbGlkYXRlRXh0ZW5zaW9uTnVtYmVyIiwiZGFfVmFsaWRhdGVFeHRlbnNpb25Jc0VtcHR5IiwiZGFfVmFsaWRhdGVFeHRlbnNpb25Eb3VibGUiLCJpbml0aWFsaXplIiwidGFiIiwibGVuZ3RoIiwiZHJvcGRvd24iLCJvbkNoYW5nZSIsImNoYW5nZUFjZU1vZGUiLCJvbiIsIm5ld051bWJlciIsIkV4dGVuc2lvbnMiLCJjaGVja0F2YWlsYWJpbGl0eSIsImluaXRpYWxpemVGb3JtIiwiaW5pdGlhbGl6ZUFjZSIsImFwcGxpY2F0aW9uTG9naWMiLCJhY2VIZWlnaHQiLCJ3aW5kb3ciLCJpbm5lckhlaWdodCIsInJvd3NDb3VudCIsIk1hdGgiLCJyb3VuZCIsImxvYWQiLCJjc3MiLCJhY2UiLCJlZGl0IiwiZ2V0U2Vzc2lvbiIsInNldFZhbHVlIiwic2V0VGhlbWUiLCJyZXNpemUiLCJ2YWwiLCJyYW5kb20iLCJ0cmlnZ2VyIiwic2V0T3B0aW9ucyIsIm1heExpbmVzIiwic2hvd1ByaW50TWFyZ2luIiwic2hvd0xpbmVOdW1iZXJzIiwibW9kZSIsIk5ld01vZGUiLCJyZXF1aXJlIiwiTW9kZSIsInNlc3Npb24iLCJzZXRNb2RlIiwiY2JCZWZvcmVTZW5kRm9ybSIsInJlc3VsdCIsImRhdGEiLCJhcHBsaWNhdGlvbmxvZ2ljIiwiZ2V0VmFsdWUiLCJjYkFmdGVyU2VuZEZvcm0iLCJGb3JtIiwidXJsIiwiZ2xvYmFsUm9vdFVybCIsImRvY3VtZW50IiwicmVhZHkiXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQTtBQUVBO0FBQ0FBLENBQUMsQ0FBQ0MsRUFBRixDQUFLQyxJQUFMLENBQVVDLFFBQVYsQ0FBbUJDLEtBQW5CLENBQXlCQyxTQUF6QixHQUFxQyxVQUFDQyxLQUFELEVBQVFDLFNBQVI7QUFBQSxTQUFzQlAsQ0FBQyxZQUFLTyxTQUFMLEVBQUQsQ0FBbUJDLFFBQW5CLENBQTRCLFFBQTVCLENBQXRCO0FBQUEsQ0FBckM7O0FBRUEsSUFBTUMsbUJBQW1CLEdBQUc7QUFDM0JDLEVBQUFBLE9BQU8sRUFBRVYsQ0FBQyxDQUFDLFlBQUQsQ0FEaUI7QUFFM0JXLEVBQUFBLGdCQUFnQixFQUFFLEVBRlM7QUFHM0JDLEVBQUFBLFFBQVEsRUFBRVosQ0FBQyxDQUFDLDRCQUFELENBSGdCO0FBSTNCYSxFQUFBQSxtQkFBbUIsRUFBRWIsQ0FBQyxDQUFDLHlDQUFELENBSks7QUFLM0JjLEVBQUFBLFlBQVksRUFBRWQsQ0FBQyxDQUFDLFNBQUQsQ0FMWTtBQU0zQmUsRUFBQUEsYUFBYSxFQUFFZixDQUFDLENBQUMsOEJBQUQsQ0FOVztBQU8zQmdCLEVBQUFBLE1BQU0sRUFBRSxFQVBtQjtBQVEzQkMsRUFBQUEsYUFBYSxFQUFFO0FBQ2RDLElBQUFBLElBQUksRUFBRTtBQUNMQyxNQUFBQSxVQUFVLEVBQUUsTUFEUDtBQUVMZixNQUFBQSxLQUFLLEVBQUUsQ0FDTjtBQUNDZ0IsUUFBQUEsSUFBSSxFQUFFLE9BRFA7QUFFQ0MsUUFBQUEsTUFBTSxFQUFFQyxlQUFlLENBQUNDO0FBRnpCLE9BRE07QUFGRixLQURRO0FBVWRDLElBQUFBLFNBQVMsRUFB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VUFBcEI7QUFDQSxDQUZEIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIE1pa29QQlggLSBmcmVlIHBob25lIHN5c3RlbSBmb3Igc21hbGwgYnVzaW5lc3NcbiAqIENvcHlyaWdodCAoQykgMjAxNy0yMDIwIEFsZXhleSBQb3J0bm92IGFuZCBOaWtvbGF5IEJla2V0b3ZcbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb247IGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uXG4gKiBJZiBub3QsIHNlZSA8aHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbi8qIGdsb2JhbCBnbG9iYWxSb290VXJsLGdsb2JhbFRyYW5zbGF0ZSwgYWNlLCBGb3JtLCBFeHRlbnNpb25zICovXG5cbi8vINCf0YDQvtCy0LXRgNC60LAg0L3QtdGCINC70Lgg0L7RiNC40LHQutC4INC30LDQvdGP0YLQvtCz0L4g0LTRgNGD0LPQvtC5INGD0YfQtdGC0LrQvtC5INC90L7QvNC10YDQsFxuJC5mbi5mb3JtLnNldHRpbmdzLnJ1bGVzLmV4aXN0UnVsZSA9ICh2YWx1ZSwgcGFyYW1ldGVyKSA9PiAkKGAjJHtwYXJhbWV0ZXJ9YCkuaGFzQ2xhc3MoJ2hpZGRlbicpO1xuXG5jb25zdCBkaWFscGxhbkFwcGxpY2F0aW9uID0ge1xuXHQkbnVtYmVyOiAkKCcjZXh0ZW5zaW9uJyksXG5cdGRlZmF1bHRFeHRlbnNpb246ICcnLFxuXHQkZm9ybU9iajogJCgnI2RpYWxwbGFuLWFwcGxpY2F0aW9uLWZvcm0nKSxcblx0JHR5cGVTZWxlY3REcm9wRG93bjogJCgnI2RpYWxwbGFuLWFwcGxpY2F0aW9uLWZvcm0gLnR5cGUtc2VsZWN0JyksXG5cdCRkaXJydHlGaWVsZDogJCgnI2RpcnJ0eScpLFxuXHQkdGFiTWVudUl0ZW1zOiAkKCcjYXBwbGljYXRpb24tY29kZS1tZW51IC5pdGVtJyksXG5cdGVkaXRvcjogJycsXG5cdHZhbGlkYXRlUnVsZXM6IHtcblx0XHRuYW1lOiB7XG5cdFx0XHRpZGVudGlmaWVyOiAnbmFtZScsXG5cdFx0XHRydWxlczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dHlwZTogJ2VtcHR5Jyxcblx0XHRcdFx0XHRwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5kYV9WYWxpZGF0ZU5hbWVJc0VtcHR5LFxuXHRcdFx0XHR9LFxuXHRcdFx0XSxcblx0XHR9LFxuXHRcdGV4dGVuc2lvbjoge1xuXHRcdFx0aWRlbnRpZmllcjogJ2V4dGVuc2lvbicsXG5cdFx0XHRydWxlczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dHlwZTogJ3JlZ0V4cCcsXG5cdFx0XHRcdFx0dmFsdWU6ICcvXih8WzAtOSMrXFxcXCp8WF17MSw2NH0pJC8nLFxuXHRcdFx0XHRcdHByb21wdDogZ2xvYmFsVHJhbnNsYXRlLmRhX1ZhbGlkYXRlRXh0ZW5zaW9uTnVtYmVyLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dHlwZTogJ2VtcHR5Jyxcblx0XHRcdFx0XHRwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5kYV9WYWxpZGF0ZUV4dGVuc2lvbklzRW1wdHksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0eXBlOiAnZXhpc3RSdWxlW2V4dGVuc2lvbi1lcnJvcl0nLFxuXHRcdFx0XHRcdHByb21wdDogZ2xvYmFsVHJhbnNsYXRlLmRhX1ZhbGlkYXRlRXh0ZW5zaW9uRG91YmxlLFxuXHRcdFx0XHR9LFxuXHRcdFx0XSxcblx0XHR9LFxuXHR9LFxuXHRpbml0aWFsaXplKCkge1xuXHRcdGRpYWxwbGFuQXBwbGljYXRpb24uJHRhYk1lbnVJdGVtcy50YWIoKTtcblx0XHRpZiAoZGlhbHBsYW5BcHBsaWNhdGlvbi4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWUnLCAnbmFtZScpLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0ZGlhbHBsYW5BcHBsaWNhdGlvbi4kdGFiTWVudUl0ZW1zLnRhYignY2hhbmdlIHRhYicsICdtYWluJyk7XG5cdFx0fVxuXHRcdGRpYWxwbGFuQXBwbGljYXRpb24uJHR5cGVTZWxlY3REcm9wRG93bi5kcm9wZG93bih7XG5cdFx0XHRvbkNoYW5nZTogZGlhbHBsYW5BcHBsaWNhdGlvbi5jaGFuZ2VBY2VNb2RlLFxuXHRcdH0pO1xuXHRcdC8vINCU0LjQvdCw0LzQuNGH0LXRgdC60LDRjyDQv9GA0L7QstC10YDQutCwINGB0LLQvtCx0L7QtNC10L0g0LvQuCDQstC90YPRgtGA0LXQvdC90LjQuSDQvdC+0LzQtdGAXG5cdFx0ZGlhbHBsYW5BcHBsaWNhdGlvbi4kbnVtYmVyLm9uKCdjaGFuZ2UnLCAoKSA9PiB7XG5cdFx0XHRjb25zdCBuZXdOdW1iZXIgPSBkaWFscGxhbkFwcGxpY2F0aW9uLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZScsICdleHRlbnNpb24nKTtcblx0XHRcdEV4dGVuc2lvbnMuY2hlY2tBdmFpbGFiaWxpdHkoZGlhbHBsYW5BcHBsaWNhdGlvbi5kZWZhdWx0RXh0ZW5zaW9uLCBuZXdOdW1iZXIpO1xuXHRcdH0pO1xuXHRcdGRpYWxwbGFuQXBwbGljYXRpb24uaW5pdGlhbGl6ZUZvcm0oKTtcblx0XHRkaWFscGxhbkFwcGxpY2F0aW9uLmluaXRpYWxpemVBY2UoKTtcblx0XHRkaWFscGxhbkFwcGxpY2F0aW9uLmNoYW5nZUFjZU1vZGUoKTtcblx0XHRkaWFscGxhbkFwcGxpY2F0aW9uLmRlZmF1bHRFeHRlbnNpb24gPSBkaWFscGxhbkFwcGxpY2F0aW9uLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZScsICdleHRlbnNpb24nKTtcblx0fSxcblx0aW5pdGlhbGl6ZUFjZSgpIHtcblx0XHRjb25zdCBhcHBsaWNhdGlvbkxvZ2ljID0gZGlhbHBsYW5BcHBsaWNhdGlvbi4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWUnLCdhcHBsaWNhdGlvbmxvZ2ljJyk7XG5cdFx0Y29uc3QgYWNlSGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0LTM4MDtcblx0XHRjb25zdCByb3dzQ291bnQgPSBNYXRoLnJvdW5kKGFjZUhlaWdodC8xNi4zKTtcblx0XHQkKHdpbmRvdykubG9hZChmdW5jdGlvbigpIHtcblx0XHRcdCQoJy5hcHBsaWNhdGlvbi1jb2RlJykuY3NzKCdtaW4taGVpZ2h0JywgYCR7YWNlSGVpZ2h0fXB4YCk7XG5cdFx0fSk7XG5cdFx0ZGlhbHBsYW5BcHBsaWNhdGlvbi5lZGl0b3IgPSBhY2UuZWRpdCgnYXBwbGljYXRpb24tY29kZScpO1xuXHRcdGRpYWxwbGFuQXBwbGljYXRpb24uZWRpdG9yLmdldFNlc3Npb24oKS5zZXRWYWx1ZShhcHBsaWNhdGlvbkxvZ2ljKTtcblx0XHRkaWFscGxhbkFwcGxpY2F0aW9uLmVkaXRvci5zZXRUaGVtZSgnYWNlL3RoZW1lL21vbm9rYWknKTtcblx0XHRkaWFscGxhbkFwcGxpY2F0aW9uLmVkaXRvci5yZXNpemUoKTtcblx0XHRkaWFscGxhbkFwcGxpY2F0aW9uLmVkaXRvci5nZXRTZXNzaW9uKCkub24oJ2NoYW5nZScsICgpID0+IHtcblx0XHRcdGRpYWxwbGFuQXBwbGljYXRpb24uJGRpcnJ0eUZpZWxkLnZhbChNYXRoLnJhbmRvbSgpKTtcblx0XHRcdGRpYWxwbGFuQXBwbGljYXRpb24uJGRpcnJ0eUZpZWxkLnRyaWdnZXIoJ2NoYW5nZScpO1xuXHRcdH0pO1xuXHRcdGRpYWxwbGFuQXBwbGljYXRpb24uZWRpdG9yLnNldE9wdGlvbnMoe1xuXHRcdFx0bWF4TGluZXM6IHJvd3NDb3VudCxcblx0XHRcdHNob3dQcmludE1hcmdpbjogZmFsc2UsXG5cdFx0XHRzaG93TGluZU51bWJlcnM6IGZhbHNlLFxuXHRcdH0pO1xuXHR9LFxuXHRjaGFuZ2VBY2VNb2RlKCkge1xuXHRcdGNvbnN0IG1vZGUgPSBkaWFscGxhbkFwcGxpY2F0aW9uLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZScsICd0eXBlJyk7XG5cdFx0bGV0IE5ld01vZGU7XG5cdFx0aWYgKG1vZGUgPT09ICdwaHAnKSB7XG5cdFx0XHROZXdNb2RlID0gYWNlLnJlcXVpcmUoJ2FjZS9tb2RlL3BocCcpLk1vZGU7XG5cdFx0XHRkaWFscGxhbkFwcGxpY2F0aW9uLmVkaXRvci5zZXRPcHRpb25zKHtcblx0XHRcdFx0c2hvd0xpbmVOdW1iZXJzOiB0cnVlLFxuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdE5ld01vZGUgPSBhY2UucmVxdWlyZSgnYWNlL21vZGUvanVsaWEnKS5Nb2RlO1xuXHRcdFx0ZGlhbHBsYW5BcHBsaWNhdGlvbi5lZGl0b3Iuc2V0T3B0aW9ucyh7XG5cdFx0XHRcdHNob3dMaW5lTnVtYmVyczogZmFsc2UsXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0ZGlhbHBsYW5BcHBsaWNhdGlvbi5lZGl0b3Iuc2Vzc2lvbi5zZXRNb2RlKG5ldyBOZXdNb2RlKCkpO1xuXHRcdGRpYWxwbGFuQXBwbGljYXRpb24uZWRpdG9yLnNldFRoZW1lKCdhY2UvdGhlbWUvbW9ub2thaScpO1xuXHR9LFxuXHRjYkJlZm9yZVNlbmRGb3JtKHNldHRpbmdzKSB7XG5cdFx0Y29uc3QgcmVzdWx0ID0gc2V0dGluZ3M7XG5cdFx0cmVzdWx0LmRhdGEgPSBkaWFscGxhbkFwcGxpY2F0aW9uLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZXMnKTtcblx0XHRyZXN1bHQuZGF0YS5hcHBsaWNhdGlvbmxvZ2ljID0gZGlhbHBsYW5BcHBsaWNhdGlvbi5lZGl0b3IuZ2V0VmFsdWUoKTtcblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9LFxuXHRjYkFmdGVyU2VuZEZvcm0oKSB7XG5cblx0fSxcblx0aW5pdGlhbGl6ZUZvcm0oKSB7XG5cdFx0Rm9ybS4kZm9ybU9iaiA9IGRpYWxwbGFuQXBwbGljYXRpb24uJGZvcm1PYmo7XG5cdFx0Rm9ybS51cmwgPSBgJHtnbG9iYWxSb290VXJsfWRpYWxwbGFuLWFwcGxpY2F0aW9ucy9zYXZlYDtcblx0XHRGb3JtLnZhbGlkYXRlUnVsZXMgPSBkaWFscGxhbkFwcGxpY2F0aW9uLnZhbGlkYXRlUnVsZXM7XG5cdFx0Rm9ybS5jYkJlZm9yZVNlbmRGb3JtID0gZGlhbHBsYW5BcHBsaWNhdGlvbi5jYkJlZm9yZVNlbmRGb3JtO1xuXHRcdEZvcm0uY2JBZnRlclNlbmRGb3JtID0gZGlhbHBsYW5BcHBsaWNhdGlvbi5jYkFmdGVyU2VuZEZvcm07XG5cdFx0Rm9ybS5pbml0aWFsaXplKCk7XG5cdH0sXG59O1xuXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG5cdGRpYWxwbGFuQXBwbGljYXRpb24uaW5pdGlhbGl6ZSgpO1xufSk7XG5cbiJdfQ==