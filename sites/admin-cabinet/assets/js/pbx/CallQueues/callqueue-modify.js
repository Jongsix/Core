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

/* global globalRootUrl, globalTranslate, Extensions,Form  */
// Проверка нет ли ошибки занятого другой учеткой номера
$.fn.form.settings.rules.existRule = function (value, parameter) {
  return $("#".concat(parameter)).hasClass('hidden');
};

var callQueue = {
  defaultExtension: '',
  $number: $('#extension'),
  $dirrtyField: $('#dirrty'),
  AvailableMembersList: [],
  $formObj: $('#queue-form'),
  $accordions: $('#queue-form .ui.accordion'),
  $dropDowns: $('#queue-form .dropdown'),
  $errorMessages: $('#form-error-messages'),
  $checkBoxes: $('#queue-form .checkbox'),
  forwardingSelect: '#queue-form .forwarding-select',
  $deleteRowButton: $('.delete-row-button'),
  $periodicAnnounceDropdown: $('#queue-form .periodic-announce-sound-id-select'),
  memberRow: '#queue-form .member-row',
  $extensionSelectDropdown: $('#extensionselect'),
  $extensionsTable: $('#extensionsTable'),
  validateRules: {
    name: {
      identifier: 'name',
      rules: [{
        type: 'empty',
        prompt: globalTranslate.cq_ValidateNameEmpty
      }]
    },
    extension: {
      identifier: 'extension',
      rules: [{
        type: 'number',
        prompt: globalTranslate.cq_ValidateExtensionNumber
      }, {
        type: 'empty',
        prompt: globalTranslate.cq_ValidateExtensionEmpty
      }, {
        type: 'existRule[extension-error]',
        prompt: globalTranslate.cq_ValidateExtensionDouble
      }]
    }
  },
  initialize: function () {
    function initialize() {
      Extensions.getPhoneExtensions(callQueue.setAvailableQueueMembers);
      callQueue.defaultExtension = $('#extension').val();
      callQueue.$accordions.accordion();
      callQueue.$dropDowns.dropdown();
      callQueue.$checkBoxes.checkbox();
      callQueue.$periodicAnnounceDropdown.dropdown({
        onChange: function () {
          function onChange(value) {
            if (parseInt(value, 10) === -1) {
              callQueue.$periodicAnnounceDropdown.dropdown('clear');
            }
          }

          return onChange;
        }()
      });
      $(callQueue.forwardingSelect).dropdown(Extensions.getDropdownSettingsWithEmpty()); // Динамическая прововерка свободен ли внутренний номер

      callQueue.$number.on('change', function () {
        var newNumber = callQueue.$formObj.form('get value', 'extension');
        Extensions.checkAvailability(callQueue.defaultNumber, newNumber);
      });
      callQueue.initializeDragAndDropExtensionTableRows(); // Удаление строки из таблицы участников очереди

      callQueue.$deleteRowButton.on('click', function (e) {
        $(e.target).closest('tr').remove();
        callQueue.reinitializeExtensionSelect();
        callQueue.updateExtensionTableView();
        callQueue.$dirrtyField.val(Math.random());
        callQueue.$dirrtyField.trigger('change');
        e.preventDefault();
        return false;
      });
      callQueue.initializeForm();
    }

    return initialize;
  }(),
  setAvailableQueueMembers: function () {
    function setAvailableQueueMembers(arrResult) {
      $.each(arrResult.results, function (index, extension) {
        callQueue.AvailableMembersList.push({
          number: extension.value,
          callerid: extension.name
        });
      });
      callQueue.reinitializeExtensionSelect();
      callQueue.updateExtensionTableView();
    }

    return setAvailableQueueMembers;
  }(),
  // Вернуть список доступных членов очереди
  getAvailableQueueMembers: function () {
    function getAvailableQueueMembers() {
      var result = [];
      callQueue.AvailableMembersList.forEach(function (member) {
        if ($(".member-row#".concat(member.number)).length === 0) {
          result.push({
            name: member.callerid,
            value: member.number
          });
        }
      }); // result.sort((a, b) => ((a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)));

      return result;
    }

    return getAvailableQueueMembers;
  }(),
  // Пересобрать членов очереди с учетом уже выбранных
  reinitializeExtensionSelect: function () {
    function reinitializeExtensionSelect() {
      callQueue.$extensionSelectDropdown.dropdown({
        action: 'hide',
        forceSelection: false,
        onChange: function () {
          function onChange(value, text) {
            if (value) {
              var $tr = $('.member-row-tpl').last();
              var $clone = $tr.clone(true);
              $clone.removeClass('member-row-tpl').addClass('member-row').show();
              $clone.attr('id', value);
              $clone.find('.number').html(value);
              $clone.find('.callerid').html(text);

              if ($(callQueue.memberRow).last().length === 0) {
                $tr.after($clone);
              } else {
                $(callQueue.memberRow).last().after($clone);
              }

              callQueue.reinitializeExtensionSelect();
              callQueue.updateExtensionTableView();
              callQueue.$dirrtyField.val(Math.random());
              callQueue.$dirrtyField.trigger('change');
            }
          }

          return onChange;
        }(),
        values: callQueue.getAvailableQueueMembers()
      });
    }

    return reinitializeExtensionSelect;
  }(),
  // Включить возможность перетаскивания элементов таблицы участников очереди
  initializeDragAndDropExtensionTableRows: function () {
    function initializeDragAndDropExtensionTableRows() {
      callQueue.$extensionsTable.tableDnD({
        onDragClass: 'hoveringRow',
        dragHandle: '.dragHandle',
        onDrop: function () {
          function onDrop() {
            callQueue.$dirrtyField.val(Math.random());
            callQueue.$dirrtyField.trigger('change');
          }

          return onDrop;
        }()
      });
    }

    return initializeDragAndDropExtensionTableRows;
  }(),
  // Отобразить заглушку если в таблице 0 строк
  updateExtensionTableView: function () {
    function updateExtensionTableView() {
      var dummy = "<tr class=\"dummy\"><td colspan=\"4\" class=\"center aligned\">".concat(globalTranslate.cq_AddQueueMembers, "</td></tr>");

      if ($(callQueue.memberRow).length === 0) {
        $('#extensionsTable tbody').append(dummy);
      } else {
        $('#extensionsTable tbody .dummy').remove();
      }
    }

    return updateExtensionTableView;
  }(),
  cbBeforeSendForm: function () {
    function cbBeforeSendForm(settings) {
      var result = settings;
      result.data = callQueue.$formObj.form('get values');
      var arrMembers = [];
      $(callQueue.memberRow).each(function (index, obj) {
        if ($(obj).attr('id')) {
          arrMembers.push({
            number: $(obj).attr('id'),
            priority: index
          });
        }
      });

      if (arrMembers.length === 0) {
        result = false;
        callQueue.$errorMessages.html(globalTranslate.cq_ValidateNoExtensions);
        callQueue.$formObj.addClass('error');
      } else {
        result.data.members = JSON.stringify(arrMembers);
      }

      return result;
    }

    return cbBeforeSendForm;
  }(),
  cbAfterSendForm: function () {
    function cbAfterSendForm() {
      callQueue.defaultNumber = callQueue.$number.val();
    }

    return cbAfterSendForm;
  }(),
  initializeForm: function () {
    function initializeForm() {
      Form.$formObj = callQueue.$formObj;
      Form.url = "".concat(globalRootUrl, "call-queues/save");
      Form.validateRules = callQueue.validateRules;
      Form.cbBeforeSendForm = callQueue.cbBeforeSendForm;
      Form.cbAfterSendForm = callQueue.cbAfterSendForm;
      Form.initialize();
    }

    return initializeForm;
  }()
};
$(document).ready(function () {
  callQueue.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9DYWxsUXVldWVzL2NhbGxxdWV1ZS1tb2RpZnkuanMiXSwibmFtZXMiOlsiJCIsImZuIiwiZm9ybSIsInNldHRpbmdzIiwicnVsZXMiLCJleGlzdFJ1bGUiLCJ2YWx1ZSIsInBhcmFtZXRlciIsImhhc0NsYXNzIiwiY2FsbFF1ZXVlIiwiZGVmYXVsdEV4dGVuc2lvbiIsIiRudW1iZXIiLCIkZGlycnR5RmllbGQiLCJBdmFpbGFibGVNZW1iZXJzTGlzdCIsIiRmb3JtT2JqIiwiJGFjY29yZGlvbnMiLCIkZHJvcERvd25zIiwiJGVycm9yTWVzc2FnZXMiLCIkY2hlY2tCb3hlcyIsImZvcndhcmRpbmdTZWxlY3QiLCIkZGVsZXRlUm93QnV0dG9uIiwiJHBlcmlvZGljQW5ub3VuY2VEcm9wZG93biIsIm1lbWJlclJvdyIsIiRleHRlbnNpb25TZWxlY3REcm9wZG93biIsIiRleHRlbnNpb25zVGFibGUiLCJ2YWxpZGF0ZVJ1bGVzIiwibmFtZSIsImlkZW50aWZpZXIiLCJ0eXBlIiwicHJvbXB0IiwiZ2xvYmFsVHJhbnNsYXRlIiwiY3FfVmFsaWRhdGVOYW1lRW1wdHkiLCJleHRlbnNpb24iLCJjcV9WYWxpZGF0ZUV4dGVuc2lvbk51bWJlciIsImNxX1ZhbGlkYXRlRXh0ZW5zaW9uRW1wdHkiLCJjcV9WYWxpZGF0ZUV4dGVuc2lvbkRvdWJsZSIsImluaXRpYWxpemUiLCJFeHRlbnNpb25zIiwiZ2V0UGhvbmVFeHRlbnNpb25zIiwic2V0QXZhaWxhYmxlUXVldWVNZW1iZXJzIiwidmFsIiwiYWNjb3JkaW9uIiwiZHJvcGRvd24iLCJjaGVja2JveCIsIm9uQ2hhbmdlIiwicGFyc2VJbnQiLCJnZXREcm9wZG93blNldHRpbmdzV2l0aEVtcHR5Iiwib24iLCJuZXdOdW1iZXIiLCJjaGVja0F2YWlsYWJpbGl0eSIsImRlZmF1bHROdW1iZXIiLCJpbml0aWFsaXplRHJhZ0FuZERyb3BFeHRlbnNpb25UYWJsZVJvd3MiLCJlIiwidGFyZ2V0IiwiY2xvc2VzdCIsInJlbW92ZSIsInJlaW5pdGlhbGl6ZUV4dGVuc2lvblNlbGVjdCIsInVwZGF0ZUV4dGVuc2lvblRhYmxlVmlldyIsIk1hdGgiLCJyYW5kb20iLCJ0cmlnZ2VyIiwicHJldmVudERlZmF1bHQiLCJpbml0aWFsaXplRm9ybSIsImFyclJlc3VsdCIsImVhY2giLCJyZXN1bHRzIiwiaW5kZXgiLCJwdXNoIiwibnVtYmVyIiwiY2FsbGVyaWQiLCJnZXRBdmFpbGFibGVRdWV1ZU1lbWJlcnMiLCJyZXN1bHQiLCJmb3JFYWNoIiwibWVtYmVyIiwibGVuZ3RoIiwiYWN0aW9uIiwiZm9yY2VTZWxlY3Rpb24iLCJ0ZXh0IiwiJHRyIiwibGFzdCIsIiRjbG9uZSIsImNsb25lIiwicmVtb3ZlQ2xhc3MiLCJhZGRDbGFzcyIsInNob3ciLCJhdHRyIiwiZmluZCIsImh0bWwiLCJhZnRlciIsInZhbHVlcyIsInRhYmxlRG5EIiwib25EcmFnQ2xhc3MiLCJkcmFnSGFuZGxlIiwib25Ecm9wIiwiZHVtbXkiLCJjcV9BZGRRdWV1ZU1lbWJlcnMiLCJhcHBlbmQiLCJjYkJlZm9yZVNlbmRGb3JtIiwiZGF0YSIsImFyck1lbWJlcnMiLCJvYmoiLCJwcmlvcml0eSIsImNxX1ZhbGlkYXRlTm9FeHRlbnNpb25zIiwibWVtYmVycyIsIkpTT04iLCJzdHJpbmdpZnkiLCJjYkFmdGVyU2VuZEZvcm0iLCJGb3JtIiwidXJsIiwiZ2xvYmFsUm9vdFVybCIsImRvY3VtZW50IiwicmVhZHkiXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQTtBQUVBO0FBQ0FBLENBQUMsQ0FBQ0MsRUFBRixDQUFLQyxJQUFMLENBQVVDLFFBQVYsQ0FBbUJDLEtBQW5CLENBQXlCQyxTQUF6QixHQUFxQyxVQUFDQyxLQUFELEVBQVFDLFNBQVI7QUFBQSxTQUFzQlAsQ0FBQyxZQUFLTyxTQUFMLEVBQUQsQ0FBbUJDLFFBQW5CLENBQTRCLFFBQTVCLENBQXRCO0FBQUEsQ0FBckM7O0FBRUEsSUFBTUMsU0FBUyxHQUFHO0FBQ2pC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QSxJQUFJLENBQUNELGVBQUwsR0FBdUJqRyxTQUFTLENBQUNpRyxlQUFqQztBQUNBQyxNQUFBQSxJQUFJLENBQUN2RSxVQUFMO0FBQ0E7O0FBN0xnQjtBQUFBO0FBQUEsQ0FBbEI7QUFnTUFwQyxDQUFDLENBQUM4RyxRQUFELENBQUQsQ0FBWUMsS0FBWixDQUFrQixZQUFNO0FBQ3ZCdEcsRUFBQUEsU0FBUyxDQUFDMkIsVUFBVjtBQUNBLENBRkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogTWlrb1BCWCAtIGZyZWUgcGhvbmUgc3lzdGVtIGZvciBzbWFsbCBidXNpbmVzc1xuICogQ29weXJpZ2h0IChDKSAyMDE3LTIwMjAgQWxleGV5IFBvcnRub3YgYW5kIE5pa29sYXkgQmVrZXRvdlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbjsgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbiAqIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS5cbiAqIElmIG5vdCwgc2VlIDxodHRwczovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKi9cblxuLyogZ2xvYmFsIGdsb2JhbFJvb3RVcmwsIGdsb2JhbFRyYW5zbGF0ZSwgRXh0ZW5zaW9ucyxGb3JtICAqL1xuXG4vLyDQn9GA0L7QstC10YDQutCwINC90LXRgiDQu9C4INC+0YjQuNCx0LrQuCDQt9Cw0L3Rj9GC0L7Qs9C+INC00YDRg9Cz0L7QuSDRg9GH0LXRgtC60L7QuSDQvdC+0LzQtdGA0LBcbiQuZm4uZm9ybS5zZXR0aW5ncy5ydWxlcy5leGlzdFJ1bGUgPSAodmFsdWUsIHBhcmFtZXRlcikgPT4gJChgIyR7cGFyYW1ldGVyfWApLmhhc0NsYXNzKCdoaWRkZW4nKTtcblxuY29uc3QgY2FsbFF1ZXVlID0ge1xuXHRkZWZhdWx0RXh0ZW5zaW9uOiAnJyxcblx0JG51bWJlcjogJCgnI2V4dGVuc2lvbicpLFxuXHQkZGlycnR5RmllbGQ6ICQoJyNkaXJydHknKSxcblx0QXZhaWxhYmxlTWVtYmVyc0xpc3Q6IFtdLFxuXHQkZm9ybU9iajogJCgnI3F1ZXVlLWZvcm0nKSxcblx0JGFjY29yZGlvbnM6ICQoJyNxdWV1ZS1mb3JtIC51aS5hY2NvcmRpb24nKSxcblx0JGRyb3BEb3duczogJCgnI3F1ZXVlLWZvcm0gLmRyb3Bkb3duJyksXG5cdCRlcnJvck1lc3NhZ2VzOiAkKCcjZm9ybS1lcnJvci1tZXNzYWdlcycpLFxuXHQkY2hlY2tCb3hlczogJCgnI3F1ZXVlLWZvcm0gLmNoZWNrYm94JyksXG5cdGZvcndhcmRpbmdTZWxlY3Q6ICcjcXVldWUtZm9ybSAuZm9yd2FyZGluZy1zZWxlY3QnLFxuXHQkZGVsZXRlUm93QnV0dG9uOiAkKCcuZGVsZXRlLXJvdy1idXR0b24nKSxcblx0JHBlcmlvZGljQW5ub3VuY2VEcm9wZG93bjogJCgnI3F1ZXVlLWZvcm0gLnBlcmlvZGljLWFubm91bmNlLXNvdW5kLWlkLXNlbGVjdCcpLFxuXHRtZW1iZXJSb3c6ICcjcXVldWUtZm9ybSAubWVtYmVyLXJvdycsXG5cdCRleHRlbnNpb25TZWxlY3REcm9wZG93bjogJCgnI2V4dGVuc2lvbnNlbGVjdCcpLFxuXHQkZXh0ZW5zaW9uc1RhYmxlOiAkKCcjZXh0ZW5zaW9uc1RhYmxlJyksXG5cdHZhbGlkYXRlUnVsZXM6IHtcblx0XHRuYW1lOiB7XG5cdFx0XHRpZGVudGlmaWVyOiAnbmFtZScsXG5cdFx0XHRydWxlczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dHlwZTogJ2VtcHR5Jyxcblx0XHRcdFx0XHRwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5jcV9WYWxpZGF0ZU5hbWVFbXB0eSxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0fSxcblx0XHRleHRlbnNpb246IHtcblx0XHRcdGlkZW50aWZpZXI6ICdleHRlbnNpb24nLFxuXHRcdFx0cnVsZXM6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHR5cGU6ICdudW1iZXInLFxuXHRcdFx0XHRcdHByb21wdDogZ2xvYmFsVHJhbnNsYXRlLmNxX1ZhbGlkYXRlRXh0ZW5zaW9uTnVtYmVyLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dHlwZTogJ2VtcHR5Jyxcblx0XHRcdFx0XHRwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5jcV9WYWxpZGF0ZUV4dGVuc2lvbkVtcHR5LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dHlwZTogJ2V4aXN0UnVsZVtleHRlbnNpb24tZXJyb3JdJyxcblx0XHRcdFx0XHRwcm9tcHQ6IGdsb2JhbFRyYW5zbGF0ZS5jcV9WYWxpZGF0ZUV4dGVuc2lvbkRvdWJsZSxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0fSxcblx0fSxcblx0aW5pdGlhbGl6ZSgpIHtcblx0XHRFeHRlbnNpb25zLmdldFBob25lRXh0ZW5zaW9ucyhjYWxsUXVldWUuc2V0QXZhaWxhYmxlUXVldWVNZW1iZXJzKTtcblx0XHRjYWxsUXVldWUuZGVmYXVsdEV4dGVuc2lvbiA9ICQoJyNleHRlbnNpb24nKS52YWwoKTtcblx0XHRjYWxsUXVldWUuJGFjY29yZGlvbnMuYWNjb3JkaW9uKCk7XG5cdFx0Y2FsbFF1ZXVlLiRkcm9wRG93bnMuZHJvcGRvd24oKTtcblx0XHRjYWxsUXVldWUuJGNoZWNrQm94ZXMuY2hlY2tib3goKTtcblx0XHRjYWxsUXVldWUuJHBlcmlvZGljQW5ub3VuY2VEcm9wZG93bi5kcm9wZG93bih7XG5cdFx0XHRvbkNoYW5nZSh2YWx1ZSkge1xuXHRcdFx0XHRpZiAocGFyc2VJbnQodmFsdWUsIDEwKSA9PT0gLTEpIHtcblx0XHRcdFx0XHRjYWxsUXVldWUuJHBlcmlvZGljQW5ub3VuY2VEcm9wZG93bi5kcm9wZG93bignY2xlYXInKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHR9KTtcblx0XHQkKGNhbGxRdWV1ZS5mb3J3YXJkaW5nU2VsZWN0KS5kcm9wZG93bihFeHRlbnNpb25zLmdldERyb3Bkb3duU2V0dGluZ3NXaXRoRW1wdHkoKSk7XG5cdFx0Ly8g0JTQuNC90LDQvNC40YfQtdGB0LrQsNGPINC/0YDQvtCy0L7QstC10YDQutCwINGB0LLQvtCx0L7QtNC10L0g0LvQuCDQstC90YPRgtGA0LXQvdC90LjQuSDQvdC+0LzQtdGAXG5cdFx0Y2FsbFF1ZXVlLiRudW1iZXIub24oJ2NoYW5nZScsICgpID0+IHtcblx0XHRcdGNvbnN0IG5ld051bWJlciA9IGNhbGxRdWV1ZS4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWUnLCAnZXh0ZW5zaW9uJyk7XG5cdFx0XHRFeHRlbnNpb25zLmNoZWNrQXZhaWxhYmlsaXR5KGNhbGxRdWV1ZS5kZWZhdWx0TnVtYmVyLCBuZXdOdW1iZXIpO1xuXHRcdH0pO1xuXG5cdFx0Y2FsbFF1ZXVlLmluaXRpYWxpemVEcmFnQW5kRHJvcEV4dGVuc2lvblRhYmxlUm93cygpO1xuXG5cdFx0Ly8g0KPQtNCw0LvQtdC90LjQtSDRgdGC0YDQvtC60Lgg0LjQtyDRgtCw0LHQu9C40YbRiyDRg9GH0LDRgdGC0L3QuNC60L7QsiDQvtGH0LXRgNC10LTQuFxuXHRcdGNhbGxRdWV1ZS4kZGVsZXRlUm93QnV0dG9uLm9uKCdjbGljaycsIChlKSA9PiB7XG5cdFx0XHQkKGUudGFyZ2V0KS5jbG9zZXN0KCd0cicpLnJlbW92ZSgpO1xuXHRcdFx0Y2FsbFF1ZXVlLnJlaW5pdGlhbGl6ZUV4dGVuc2lvblNlbGVjdCgpO1xuXHRcdFx0Y2FsbFF1ZXVlLnVwZGF0ZUV4dGVuc2lvblRhYmxlVmlldygpO1xuXHRcdFx0Y2FsbFF1ZXVlLiRkaXJydHlGaWVsZC52YWwoTWF0aC5yYW5kb20oKSk7XG5cdFx0XHRjYWxsUXVldWUuJGRpcnJ0eUZpZWxkLnRyaWdnZXIoJ2NoYW5nZScpO1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0pO1xuXG5cdFx0Y2FsbFF1ZXVlLmluaXRpYWxpemVGb3JtKCk7XG5cdH0sXG5cdHNldEF2YWlsYWJsZVF1ZXVlTWVtYmVycyhhcnJSZXN1bHQpIHtcblx0XHQkLmVhY2goYXJyUmVzdWx0LnJlc3VsdHMsIChpbmRleCwgZXh0ZW5zaW9uKSA9PiB7XG5cdFx0XHRjYWxsUXVldWUuQXZhaWxhYmxlTWVtYmVyc0xpc3QucHVzaCh7XG5cdFx0XHRcdG51bWJlcjogZXh0ZW5zaW9uLnZhbHVlLFxuXHRcdFx0XHRjYWxsZXJpZDogZXh0ZW5zaW9uLm5hbWUsXG5cdFx0XHR9KTtcblx0XHR9KTtcblx0XHRjYWxsUXVldWUucmVpbml0aWFsaXplRXh0ZW5zaW9uU2VsZWN0KCk7XG5cdFx0Y2FsbFF1ZXVlLnVwZGF0ZUV4dGVuc2lvblRhYmxlVmlldygpO1xuXHR9LFxuXHQvLyDQktC10YDQvdGD0YLRjCDRgdC/0LjRgdC+0Log0LTQvtGB0YLRg9C/0L3Ri9GFINGH0LvQtdC90L7QsiDQvtGH0LXRgNC10LTQuFxuXHRnZXRBdmFpbGFibGVRdWV1ZU1lbWJlcnMoKSB7XG5cdFx0Y29uc3QgcmVzdWx0ID0gW107XG5cdFx0Y2FsbFF1ZXVlLkF2YWlsYWJsZU1lbWJlcnNMaXN0LmZvckVhY2goKG1lbWJlcikgPT4ge1xuXHRcdFx0aWYgKCQoYC5tZW1iZXItcm93IyR7bWVtYmVyLm51bWJlcn1gKS5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0cmVzdWx0LnB1c2goe1xuXHRcdFx0XHRcdG5hbWU6IG1lbWJlci5jYWxsZXJpZCxcblx0XHRcdFx0XHR2YWx1ZTogbWVtYmVyLm51bWJlcixcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Ly8gcmVzdWx0LnNvcnQoKGEsIGIpID0+ICgoYS5uYW1lID4gYi5uYW1lKSA/IDEgOiAoKGIubmFtZSA+IGEubmFtZSkgPyAtMSA6IDApKSk7XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fSxcblx0Ly8g0J/QtdGA0LXRgdC+0LHRgNCw0YLRjCDRh9C70LXQvdC+0LIg0L7Rh9C10YDQtdC00Lgg0YEg0YPRh9C10YLQvtC8INGD0LbQtSDQstGL0LHRgNCw0L3QvdGL0YVcblx0cmVpbml0aWFsaXplRXh0ZW5zaW9uU2VsZWN0KCkge1xuXHRcdGNhbGxRdWV1ZS4kZXh0ZW5zaW9uU2VsZWN0RHJvcGRvd24uZHJvcGRvd24oe1xuXHRcdFx0YWN0aW9uOiAnaGlkZScsXG5cdFx0XHRmb3JjZVNlbGVjdGlvbjogZmFsc2UsXG5cdFx0XHRvbkNoYW5nZSh2YWx1ZSwgdGV4dCkge1xuXHRcdFx0XHRpZiAodmFsdWUpIHtcblx0XHRcdFx0XHRjb25zdCAkdHIgPSAkKCcubWVtYmVyLXJvdy10cGwnKS5sYXN0KCk7XG5cdFx0XHRcdFx0Y29uc3QgJGNsb25lID0gJHRyLmNsb25lKHRydWUpO1xuXHRcdFx0XHRcdCRjbG9uZVxuXHRcdFx0XHRcdFx0LnJlbW92ZUNsYXNzKCdtZW1iZXItcm93LXRwbCcpXG5cdFx0XHRcdFx0XHQuYWRkQ2xhc3MoJ21lbWJlci1yb3cnKVxuXHRcdFx0XHRcdFx0LnNob3coKTtcblx0XHRcdFx0XHQkY2xvbmUuYXR0cignaWQnLCB2YWx1ZSk7XG5cdFx0XHRcdFx0JGNsb25lLmZpbmQoJy5udW1iZXInKS5odG1sKHZhbHVlKTtcblx0XHRcdFx0XHQkY2xvbmUuZmluZCgnLmNhbGxlcmlkJykuaHRtbCh0ZXh0KTtcblx0XHRcdFx0XHRpZiAoJChjYWxsUXVldWUubWVtYmVyUm93KS5sYXN0KCkubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0XHQkdHIuYWZ0ZXIoJGNsb25lKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0JChjYWxsUXVldWUubWVtYmVyUm93KS5sYXN0KCkuYWZ0ZXIoJGNsb25lKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRjYWxsUXVldWUucmVpbml0aWFsaXplRXh0ZW5zaW9uU2VsZWN0KCk7XG5cdFx0XHRcdFx0Y2FsbFF1ZXVlLnVwZGF0ZUV4dGVuc2lvblRhYmxlVmlldygpO1xuXHRcdFx0XHRcdGNhbGxRdWV1ZS4kZGlycnR5RmllbGQudmFsKE1hdGgucmFuZG9tKCkpO1xuXHRcdFx0XHRcdGNhbGxRdWV1ZS4kZGlycnR5RmllbGQudHJpZ2dlcignY2hhbmdlJyk7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHR2YWx1ZXM6IGNhbGxRdWV1ZS5nZXRBdmFpbGFibGVRdWV1ZU1lbWJlcnMoKSxcblxuXHRcdH0pO1xuXHR9LCAvLyDQktC60LvRjtGH0LjRgtGMINCy0L7Qt9C80L7QttC90L7RgdGC0Ywg0L/QtdGA0LXRgtCw0YHQutC40LLQsNC90LjRjyDRjdC70LXQvNC10L3RgtC+0LIg0YLQsNCx0LvQuNGG0Ysg0YPRh9Cw0YHRgtC90LjQutC+0LIg0L7Rh9C10YDQtdC00LhcblxuXHRpbml0aWFsaXplRHJhZ0FuZERyb3BFeHRlbnNpb25UYWJsZVJvd3MoKSB7XG5cdFx0Y2FsbFF1ZXVlLiRleHRlbnNpb25zVGFibGUudGFibGVEbkQoe1xuXHRcdFx0b25EcmFnQ2xhc3M6ICdob3ZlcmluZ1JvdycsXG5cdFx0XHRkcmFnSGFuZGxlOiAnLmRyYWdIYW5kbGUnLFxuXHRcdFx0b25Ecm9wOiAoKSA9PiB7XG5cdFx0XHRcdGNhbGxRdWV1ZS4kZGlycnR5RmllbGQudmFsKE1hdGgucmFuZG9tKCkpO1xuXHRcdFx0XHRjYWxsUXVldWUuJGRpcnJ0eUZpZWxkLnRyaWdnZXIoJ2NoYW5nZScpO1xuXHRcdFx0fSxcblx0XHR9KTtcblx0fSxcblxuXHQvLyDQntGC0L7QsdGA0LDQt9C40YLRjCDQt9Cw0LPQu9GD0YjQutGDINC10YHQu9C4INCyINGC0LDQsdC70LjRhtC1IDAg0YHRgtGA0L7QulxuXHR1cGRhdGVFeHRlbnNpb25UYWJsZVZpZXcoKSB7XG5cdFx0Y29uc3QgZHVtbXkgPSBgPHRyIGNsYXNzPVwiZHVtbXlcIj48dGQgY29sc3Bhbj1cIjRcIiBjbGFzcz1cImNlbnRlciBhbGlnbmVkXCI+JHtnbG9iYWxUcmFuc2xhdGUuY3FfQWRkUXVldWVNZW1iZXJzfTwvdGQ+PC90cj5gO1xuXG5cdFx0aWYgKCQoY2FsbFF1ZXVlLm1lbWJlclJvdykubGVuZ3RoID09PSAwKSB7XG5cdFx0XHQkKCcjZXh0ZW5zaW9uc1RhYmxlIHRib2R5JykuYXBwZW5kKGR1bW15KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0JCgnI2V4dGVuc2lvbnNUYWJsZSB0Ym9keSAuZHVtbXknKS5yZW1vdmUoKTtcblx0XHR9XG5cdH0sXG5cdGNiQmVmb3JlU2VuZEZvcm0oc2V0dGluZ3MpIHtcblx0XHRsZXQgcmVzdWx0ID0gc2V0dGluZ3M7XG5cdFx0cmVzdWx0LmRhdGEgPSBjYWxsUXVldWUuJGZvcm1PYmouZm9ybSgnZ2V0IHZhbHVlcycpO1xuXHRcdGNvbnN0IGFyck1lbWJlcnMgPSBbXTtcblx0XHQkKGNhbGxRdWV1ZS5tZW1iZXJSb3cpLmVhY2goKGluZGV4LCBvYmopID0+IHtcblx0XHRcdGlmICgkKG9iaikuYXR0cignaWQnKSkge1xuXHRcdFx0XHRhcnJNZW1iZXJzLnB1c2goe1xuXHRcdFx0XHRcdG51bWJlcjogJChvYmopLmF0dHIoJ2lkJyksXG5cdFx0XHRcdFx0cHJpb3JpdHk6IGluZGV4LFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRpZiAoYXJyTWVtYmVycy5sZW5ndGggPT09IDApIHtcblx0XHRcdHJlc3VsdCA9IGZhbHNlO1xuXHRcdFx0Y2FsbFF1ZXVlLiRlcnJvck1lc3NhZ2VzLmh0bWwoZ2xvYmFsVHJhbnNsYXRlLmNxX1ZhbGlkYXRlTm9FeHRlbnNpb25zKTtcblx0XHRcdGNhbGxRdWV1ZS4kZm9ybU9iai5hZGRDbGFzcygnZXJyb3InKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzdWx0LmRhdGEubWVtYmVycyA9IEpTT04uc3RyaW5naWZ5KGFyck1lbWJlcnMpO1xuXHRcdH1cblxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH0sXG5cdGNiQWZ0ZXJTZW5kRm9ybSgpIHtcblx0XHRjYWxsUXVldWUuZGVmYXVsdE51bWJlciA9IGNhbGxRdWV1ZS4kbnVtYmVyLnZhbCgpO1xuXHR9LFxuXHRpbml0aWFsaXplRm9ybSgpIHtcblx0XHRGb3JtLiRmb3JtT2JqID0gY2FsbFF1ZXVlLiRmb3JtT2JqO1xuXHRcdEZvcm0udXJsID0gYCR7Z2xvYmFsUm9vdFVybH1jYWxsLXF1ZXVlcy9zYXZlYDtcblx0XHRGb3JtLnZhbGlkYXRlUnVsZXMgPSBjYWxsUXVldWUudmFsaWRhdGVSdWxlcztcblx0XHRGb3JtLmNiQmVmb3JlU2VuZEZvcm0gPSBjYWxsUXVldWUuY2JCZWZvcmVTZW5kRm9ybTtcblx0XHRGb3JtLmNiQWZ0ZXJTZW5kRm9ybSA9IGNhbGxRdWV1ZS5jYkFmdGVyU2VuZEZvcm07XG5cdFx0Rm9ybS5pbml0aWFsaXplKCk7XG5cdH0sXG59O1xuXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG5cdGNhbGxRdWV1ZS5pbml0aWFsaXplKCk7XG59KTtcblxuIl19