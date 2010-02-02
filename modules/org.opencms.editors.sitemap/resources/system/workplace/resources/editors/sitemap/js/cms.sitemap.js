﻿(function(cms) {
   var M = cms.messages;
   /** html-class for additional info. */
   var classAdditionalInfo = 'cms-additional';
   
   /** html-class to show additional info. */
   var classAdditionalShow = 'cms-additional-show';
   
   /** html-class for closed item. */
   var classClosed = 'cms-closed';
   
   /** html-class for opener handle. */
   var classOpener = 'cms-opener';
   
   /** html-class for direct input. */
   var classDirectInput = 'cms-direct-input';
   
   /** html-class for subtree items within menu-lists to hide sub-pages. */
   var classForceClosed = 'cms-force-closed';
   
   /** html-class for hovered elements. */
   var classHovered = 'cms-hovered';
   
   /** html-class for subtree items. */
   var classSubtree = 'cms-subtree';
   
   /** html-class for dragged item. */
   var dragClass = 'cms-dragging';
   
   var helperClass = 'cms-drag-helper';
   
   /** html-class for dropzone. */
   var dropzoneClass = 'cms-dropzone';
   
   /** html-class for sitemap-item. */
   var itemClass = 'cms-sitemap-item';
   
   var classId = 'cms-id';
   var classUrlName = 'cms-url-name';
   var classVfsPath = 'cms-vfs-path';
   var classSitemapEntry = 'cms-sitemap-entry';
   
   /** html-code for opener handle. */
   var openerHtml = '<span class="' + classOpener + '"></span>';
   
   /** html-id for sitemap. */
   var sitemapId = 'cms-sitemap';
   
   /** Map of jquery objects. */
   cms.sitemap.dom = {};
   cms.sitemap.favorites = [];
   cms.sitemap.recent = [];
   var MAX_RECENT = 10;
   
   var ACTION_SAVE = 'save';
   var ACTION_GET = 'get';
   var ACTION_SET = 'set';
   var ACTION_ALL = 'all';
   var ACTION_VALIDATE = 'validate';
   
   var canEditTitles = true;
   var testCanEditTitles = function() {
      return canEditTitles;
   }
   
   var classSubSitemapLink = 'cms-sub-sitemap-link';
   
   /**
    * This variable is set to a button if the button's corresponding menu is open while a drag
    * operation from the tree is started.
    * It is set to null by the dropItem, the _dropItemIntoFavorites function or the stopDrag function,
    * whichever is executed first. The function which sets the variable to null is responsible for reopening
    * the button's menu, but it will do so asynchronously in most cases.
    */
   var $reactivateButton = null;
   
   /**
    * Flag that is set in the drop functions if the dropped item should be put in the recent list.
    * The flag is read (and cleared) by the stopDrag function.
    */
   var shouldSaveRecent = false;
   
   var dragStatus = 0;
   
   /** constants for dragStatus */
   
   var NO_DRAG = 0;
   /* drag from tree */
   var NORMAL_DRAG = 1
   /* drag from menu */
   var MENU_DRAG = 2;
   
   var isDragFromRecent = null;
   var dropStatus = 0;
   
   var updateGalleryDragPosition = null;
   
   /**
    * Timer object used for delayed hover effect.
    */
   var timer = cms.sitemap.timer = {
      id: null,
      handleDiv: null,
      adeMode: null
   };
   
   /**
    * Returns an element that is used as the helper's parent element while dragging from the gallery menu.
    */
   var _getGalleryHelperContainer = function() {
      var $result = $('#cms-gallery-helper-container');
      if ($result.size() == 0) {
         $result = $('<ul id="cms-gallery-helper-container"/>').appendTo('body');
      }
      return $result;
   }
   
   /**
    * Shows/hides the additional item info in list-views.<p>
    */
   var toggleAdditionalInfo = function() {
      var elem = $(this);
      var $additionalInfo = elem.closest('.ui-widget-content').children('.cms-additional');
      if (elem.hasClass('ui-icon-triangle-1-e')) {
         elem.removeClass('ui-icon-triangle-1-e').addClass('ui-icon-triangle-1-s');
         $additionalInfo.show(5, function() {
            var list = $(this).parents('div.cms-menu');
            $('div.ui-widget-shadow', list).css({
               height: list.outerHeight() + 1
            });
         });
      } else {
         elem.removeClass('ui-icon-triangle-1-s').addClass('ui-icon-triangle-1-e');
         
         $additionalInfo.hide(5, function() {
            var list = $(this).parents('div.cms-menu');
            $('div.ui-widget-shadow', list).css({
               height: list.outerHeight() + 1
            });
         });
      }
      return false;
   };
   
   
   /**
    * Adds a sitemap entry to the recent list
    * @param {Object} entry the sitemap entry as JSON to add to the recent list
    */
   var _addRecent = function(entry) {
      cms.sitemap.recent.unshift(entry);
      while (cms.sitemap.recent.length > MAX_RECENT) {
         cms.sitemap.recent.pop();
      }
   }
   
   /**
    * Adds a sitemap entry to the list of favorites.
    * @param {Object} entry the sitemap entry as JSON to add to the favorites
    */
   var _addFavorite = function(entry) {
      cms.sitemap.favorites.unshift(entry);
   }
   
   /**
    * Adjusts the shadow of the given menu.
    *
    * @param {Object} menu the menu jQuery-object
    */
   var adjustMenuShadow = cms.sitemap.adjustMenuShadow = function(menu) {
      $('div.ui-widget-shadow', menu).css({
         width: menu.outerWidth() + 8,
         height: menu.outerHeight() + 1
      });
   }
   
   
   
   
   /**
    * Adds event handlers for the 'blur' and 'keyup' events to a text input field such that
    * the user can cancel his editing by pressing the Escape key and the 'handleChange' function passed as the second
    * parameter will be called (with the input field element, the old value and the new value as parameters)
    * if the input field loses focus or the user presses Enter.
    *
    * @param {Object} $elem the input field
    * @param {Object} handleChange the callback function
    */
   var setChangeHandler = function($elem, handleChange) {
      $elem.focus(function() {
         $elem.attr('oldValue', $elem.val());
      });
      var valueChanged = function() {
         var newVal = $elem.val();
         var oldVal = $elem.attr('oldValue');
         //$('<div/>').text(oldVal + " -> " + newVal).appendTo('body');
         handleChange($elem, oldVal, newVal);
      }
      $elem.blur(function() {
         valueChanged();
      });
      
      $elem.keyup(function(e) {
         var oldVal = $elem.data('oldValue');
         var newVal = $elem.val();
         if (e.keyCode == 13) {
            $elem.blur();
         } else if (e.keyCode == 27) {
            $elem.val(oldVal);
            $elem.unbind('blur');
            $elem.blur();
            $elem.blur(valueChanged);
         }
      });
   }
   
   var isHandlingUrlChange = false;
   
   /**
    * Handler for directly editing an URL name input field in a sitemap entry.
    *
    * @param {Object} $elem the input field
    * @param {Object} oldValue the old value of the input field
    * @param {Object} newValue the new value of the input field
    */
   var handleUrlNameChange = function($elem, oldValue, newValue) {
      //      if (isHandlingUrlChange) {
      //         return;
      //      }
      isHandlingUrlChange = true;
      cms.data.convertUrlName(newValue, function(newValue) {
         var currentLi = $elem.closest('li');
         var currentEntry = new SitemapEntry(currentLi);
         
         
         if (oldValue != newValue) {
            var $ul = currentLi.closest('ul');
            var otherUrlNames = _getOtherUrlNames($ul, currentLi.get(0));
            if (otherUrlNames[newValue]) {
               cms.util.dialogAlert(cms.util.format(M.SITEMAP_ERR_URL_NAME_ALREADY_EXISTS_1, newValue), M.SITEMAP_ERR_URL_NAME_ALREADY_EXISTS_TITLE);
               currentEntry.setUrlName(oldValue);
               isHandlingUrlChange = false;
               return;
            }
            var _renameEntry = function(value) {
               var previousUrl = currentEntry.getUrl();
               var parentUrl = previousUrl.substring(0, previousUrl.lastIndexOf('/'));
               currentEntry.setUrlName(value);
               currentEntry.setUrls(parentUrl);
               if (value != oldValue) {
                  setSitemapChanged(true);
               }
               isHandlingUrlChange = false;
            }
            var _destroy = function() {
               $dialog.dialog('destroy');
               $dialog.remove();
            }
            if (currentLi.children('ul').length) {
               var $dialog = $('<div id="cms-alert-dialog" style="display: none"></div>');
               $dialog.appendTo('body');
               $dialog.append('<p style="margin-bottom: 4px;">' + M.SITEMAP_CHANGE_URLNAME_FOR_SUBPAGES + '<br />' + M.SITEMAP_CHANGE_URLNAME_ANYWAY + '</p>');
               var buttons = {};
               buttons[M.SITEMAP_BUTTON_CHANGE_URLNAME_CANCEL] = function() {
                  _renameEntry(oldValue);
                  _destroy();
               }
               
               buttons[M.SITEMAP_BUTTON_CHANGE_URLNAME_OK] = function() {
                  _renameEntry(newValue);
                  _destroy();
               }
               $dialog.dialog({
                  zIndex: 9999,
                  title: cms.util.format(M.SITEMAP_CHANGE_URLNAME_DIALOG_TITLE_1, newValue),
                  modal: true,
                  close: function() {
                     _renameEntry(oldValue);
                     
                     _destroy();
                  },
                  buttons: buttons
               });
            } else {
               _renameEntry(newValue);
            }
         } else {
            isHandlingUrlChange = false;
            // we need to set the old value because the entry's urlname value hasn't been converted yet 
            currentEntry.setUrlName(oldValue);
         }
      });
   }
   
   
   /**
    * Adds handles for the given modes to the given item.
    *
    * @param {Object} elem the tree item
    * @param {Object} modes array of mode-objects
    */
   var addHandles = function(elem, modes) {
      var handleDiv = $('div.cms-handle', elem).empty();
      if (!handleDiv.length) {
         handleDiv = $('<div class="cms-handle"></div>').appendTo(elem);
      }
      var handles = {}
      for (i = 0; i < modes.length; i++) {
         var mode = modes[i];
         if (mode.createHandle && $.isFunction(mode.createHandle)) {
            handles[mode.name] = mode.createHandle(elem);
         }
      }
      if (cms.sitemap.currentMode && handles[cms.sitemap.currentMode.name]) {
         handles[cms.sitemap.currentMode.name].appendTo(handleDiv);
      }
      var handleCount = 0;
      for (handleName in handles) {
         handles[handleName].appendTo(handleDiv).css('display', 'none');
         handleCount++;
      }
      if ($.browser.msie) {
         // if width:auto is used, the handle covers the whole sitemap item in IE, so we calculate a width in pixels instead
         handleDiv.css('width', handleCount * 21 + 'px');
      }
   }
   
   $(function() {
      var $activeItem = $([]);
      var show = function(msg, $x) {
         $('<p/>').text(msg + ': ' + $x.get(0).nodeName + ' ' + $x.attr('class')).appendTo('body');
      }
      var itemSelector = '#cms-sitemap .' + itemClass;
      var itemsAndChildrenSelector = itemSelector + ', ' + itemSelector + ' *';
      
      var highlightItem = function($item) {
         $item.addClass('cms-list-item-hover');
         // when dragging, we don't want the visibility of the handle buttons to change,
         // especially the handle buttons in the dragged item.
         if (dragStatus == NO_DRAG) {
            var handleDiv = $item.find('.cms-handle');
            handleDiv.children().andSelf().css('display', 'block');
         }
      }
      
      var unhighlightItem = function($item) {
         $item.removeClass('cms-list-item-hover');
         // see above 
         if (dragStatus == NO_DRAG) {
            var handleDiv = $item.find('.cms-handle');
            handleDiv.children().andSelf().css('display', 'none');
         }
      }
      
      $(itemsAndChildrenSelector).live('mouseover', function() {
      
         var $item = $(this).closest('.' + itemClass);
         // the mouseout event for the previous item may not have been fired due to 
         // a bugfix needed to prevent flickering in Firefox (see below), so we make
         // sure it's not highlighted anymore 
         unhighlightItem($activeItem);
         $activeItem = $item;
         //show('mouseover', $item);
         highlightItem($item);
      });
      
      $(itemsAndChildrenSelector).live('mouseout', function() {
         var $item = $(this).closest('.' + itemClass);
         if ($(this).is('.cms-direct-input')) {
            // stop propagation - this is a fix for the flickering  which occurs when 
            // using Firefox 3.0.x and moving the mouse cursor over the handle after having
            // activated the direct input field.
            return false;
         }
         //show('mouseout', $item);
         unhighlightItem($item);
      });
      
      $(document).click(function(e) {
         // when clicks occur outside the toolbar and menus, trigger a click on the active menu button(s)
         if ($(e.target).closest('#toolbar').size() == 0) {
            $('#toolbar_content').find('button[name=new], button[name=recent], button[name=add], button[name=favorites]').filter('.ui-state-active').trigger('click');
         }
      });
      
   });
   
   /**
    * Copies css-properties form one item to another ('width', 'height', 'font-size', 'font-weight',
    * 'font-family', 'line-height', 'color', 'padding-top', 'padding-right', 'padding-bottom',
    * 'padding-left', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left').
    *
    * @param {Object} orig the original item
    * @param {Object} target the target item
    */
   var copyCss = function(orig, target) {
      // list of styles that will be copied. 'display' is left out intentionally.
      var styleNames = ['width', 'height', 'font-size', 'font-weight', 'font-family', 'line-height', 'color', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left'];
      var styles = {};
      for (i = 0; i < styleNames.length; i++) {
         styles[styleNames[i]] = orig.css(styleNames[i]);
      }
      target.css(styles);
   }
   
   /**
    * Creates an initialized toolbar button object and inserts it into the dom. This function is to be called on a mode-object only.
    *
    */
   var createButton = function(canEdit) {
      var self = this;
      if (self.wide) {
         self.button = makeWideButton(self.name, self.title, 'cms-icon-' + self.name);
      } else {
         self.button = makeModeButton(self.name, self.title, 'cms-icon-' + self.name);
      }
      self.button.click(function() {
      
         if ((cms.sitemap.currentMode == null) || (cms.sitemap.currentMode.name != self.name)) {
            var dummyLoader = function(callback) {
               callback();
            }
            var loader = self.load || dummyLoader;
            loader.call(self, function() {
               if (cms.sitemap.currentMode != null) {
                  cms.sitemap.currentMode.disable();
               }
               cms.sitemap.currentMode = self;
               self.enable();
            });
         } else {
            self.disable();
            cms.sitemap.currentMode = null;
         }
      });
      if (self.floatRight) {
         self.button.removeClass('cms-left').addClass('cms-right');
      }
      if ($.isFunction(self.init)) {
         self.init(canEdit);
      }
      return self.button;
   };
   
   
   
   /**
    * Creation function for mode objects that shouldn't have a toolbar button.
    */
   var createWithoutButton = function() {
      createButton.apply(this, arguments);
      this.button = $([]);
      return this.button;
   }
   
   /**
    * Click-handler that will delete the item of this handler after showing a confirmation-dialog.
    *
    */
   var deletePage = function() {
      var liItem = $(this).closest('li');
      
      
      
      var _deleteEntry = function() {
         if (!liItem.siblings().length) {
            var parentUl = liItem.parent();
            parentUl.siblings('span.' + classOpener).remove();
            parentUl.remove();
         }
         liItem.remove();
         
         setSitemapChanged(true);
         var sitemapEntry = new SitemapEntry(liItem.get(0));
         _addRecent(sitemapEntry.serialize(false));
         cms.data.saveRecent(function(ok, data) {
                  });
         $(document).trigger('cms-sitemap-structure-change');
      }
      
      if (isLastRootEntry(liItem)) {
         cms.util.dialogAlert(M.SITEMAP_ERR_CANT_DELETE_LAST_ROOT_ENTRY);
         return;
      }
      var hasChildren = liItem.children('ul').length > 0;
      cms.data.checkLinks(new SitemapEntry(liItem).getAllIds(), function(hasRelations) {
         var confirmMessage = "";
         if (hasChildren || hasRelations) {
            var confirmMessage = "";
            if (hasChildren && hasRelations) {
               confirmMessage = M.GUI_SITEMAP_DELETE_SUBENTRIES_AND_LINKS_WARNING_0; //'This sitemap entry has subentries. Additionally, deleting these entries will break some links. Do you really want to delete these items?';
            } else if (hasChildren) {
               confirmMessage = M.GUI_SITEMAP_DELETE_SUBENTRIES_WARNING_0; // 'This sitemap entry has subentries. Do you really want to delete it ?';
            } else if (hasRelations) {
               confirmMessage = M.GUI_SITEMAP_DELETE_LINKS_WARNING_0; // 'Deleting this sitemap entry will break links. Do you really want to delete it?'
            }
            
            var $dialog = $('<div id="cms-alert-dialog" style="display: none"></div>');
            var _destroy = function() {
               $dialog.dialog('destroy');
               $dialog.remove();
            }
            $dialog.appendTo('body');
            $dialog.text(confirmMessage /*M.SITEMAP_CONFIRM_DELETE*/);
            var buttons = {};
            buttons[M.SITEMAP_BUTTON_CONFIRM_DELETE_CANCEL] = _destroy;
            buttons[M.SITEMAP_BUTTON_CONFIRM_DELETE_OK] = function() {
               _destroy();
               _deleteEntry();
            }
            $dialog.dialog({
               zIndex: 9999,
               title: M.SITEMAP_CONFIRM_DELETE_DIALOG_TITLE,
               modal: true,
               close: _destroy,
               buttons: buttons
            });
         } else {
            _deleteEntry();
         }
      });
   }
   
   var dropzoneSelector = cms.util.format('#{0} .{1}:not(.cms-root-sitemap) > .{2}', sitemapId, classSitemapEntry, dropzoneClass);
   var dropItemSelector = cms.util.format('#{0} .{1}:not(.cms-sub-sitemap-ref)  > .{2}', sitemapId, classSitemapEntry, itemClass);
   var dropSelector = dropzoneSelector + ', ' + dropItemSelector;
   var urlNameDirectInputSelector = cms.util.format('#{0} .{1}:not(.cms-root-sitemap) > .{2} input.{3}', sitemapId, classSitemapEntry, itemClass, classUrlName);
   
   /**
    * Removes drag and drop from tree.
    *
    */
   var destroyDraggable = cms.sitemap.destroyDraggable = function() {
      $(dropSelector).droppable('destroy');
      $('.' + classSitemapEntry).draggable('destroy');
   }
   
   /**
    * Highlighting function. This will draw a border around the given element.
    *
    * @param {Object} elem the element
    * @param {Object} hOff the border offset
    * @param {Object} additionalClass additional css-class
    */
   var drawBorder = cms.sitemap.drawBorder = function(elem, hOff, additionalClass) {
      elem = $(elem);
      var tHeight = elem.outerHeight();
      var tWidth = elem.outerWidth();
      var hWidth = 2;
      var lrHeight = tHeight + 2 * (hOff + hWidth);
      var btWidth = tWidth + 2 * (hOff + hWidth);
      if (!additionalClass) {
         additionalClass = '';
      }
      var tlrTop = -(hOff + hWidth);
      var tblLeft = -(hOff + hWidth);
      // top
      $('<div class="cms-hovering cms-hovering-top"></div>').addClass(additionalClass).height(hWidth).width(btWidth).css('top', tlrTop).css('left', tblLeft).appendTo(elem);
      
      // right
      $('<div class="cms-hovering cms-hovering-right"></div>').addClass(additionalClass).height(lrHeight).width(hWidth).css('top', tlrTop).css('left', tWidth + hOff).appendTo(elem);
      // left
      $('<div class="cms-hovering cms-hovering-left"></div>').addClass(additionalClass).height(lrHeight).width(hWidth).css('top', tlrTop).css('left', tblLeft).appendTo(elem);
      // bottom
      $('<div class="cms-hovering cms-hovering-bottom"></div>').addClass(additionalClass).height(hWidth).width(btWidth).css('top', tHeight + hOff).css('left', tblLeft).appendTo(elem);
   }
   
   /**
    * Checks for duplicate url names before a sitemap entry is dropped.
    * @param {Object} $dragged the dragged sitemap entry
    * @param {Object} $dropzone the dropzone into which the entry should be dropped
    */
   var checkDuplicateOnDrop = function($dragged, $dropzone) {
      var currentEntry = new SitemapEntry($dragged.get(0));
      var otherUrlNames = {};
      if ($dropzone.hasClass(itemClass)) {
         var $targetUl = $dropzone.siblings('ul');
         if ($targetUl.size() > 0) {
            otherUrlNames = _getOtherUrlNames($targetUl, $dragged.get(0));
         }
      } else {
         var $targetUl = $dropzone.closest('ul');
         otherUrlNames = _getOtherUrlNames($targetUl, $dragged.get(0));
      }
      var urlName = currentEntry.getUrlName();
      return {
         duplicate: !!otherUrlNames[urlName],
         urlName: urlName,
         otherUrlNames: otherUrlNames
      };
   }
   
   /**
    * Handler for dropping sitemap entry into favorites
    * @param {Object} e event
    * @param {Object} ui ui-object
    * @param {Object} $dropzone the drop zone (in this case, the favorite list)
    */
   var _dropItemIntoFavorites = function(e, ui, $dropzone) {
      var $dragged = ui.draggable;
      
      $dropzone.removeClass(classHovered);
      var dragClone = ui.draggable.clone();
      dragClone.find('div.cms-handle').remove();
      var $reactivateButtonLocal = $reactivateButton;
      $reactivateButton = null;
      var _resetMenu = function() {
         if ($reactivateButtonLocal) {
            $reactivateButtonLocal.trigger('click');
         }
      }
      var _next = function() {
         dragClone.find('div.' + itemClass).removeClass(dragClass);
         dragClone.find('.' + classAdditionalShow).removeClass(classAdditionalShow);
         dragClone.appendTo(cms.sitemap.dom.favoriteList);
         var dragCloneEntry = new SitemapEntry(dragClone.get(0));
         var newFav = dragCloneEntry.serialize(false);
         
         _addFavorite(newFav);
         
         cms.data.saveFavorites(function() {
            _resetMenu();
         });
      }
      if (dragClone.find('ul').length) {
         keepTree(dragClone, _next);
      } else {
         _next();
      }
   }
   
   /**
    * Removes the extension from a file path or URL.
    *
    * @param {Object} path the path or URL
    */
   var _removeExtension = function(path) {
      // remove trailing substring consisting of a dot and a sequence of non-dot, non-slash characters
      return path.replace(/\.[^\.\/]*$/, '');
   }
   
   /**
    * Returns the parent URL for a given dropzone.
    * @param {Object} $dropzone the dropzone for which the parent URL should be returned
    */
   var _getDropzoneParentUrl = function($dropzone) {
      var parentURL = '';
      var $li = $dropzone.parent();
      var dropzoneEntry = new SitemapEntry($li.get(0));
      if ($dropzone.hasClass(dropzoneClass)) {
         var $parentLi = $li.parent().closest('li');
         // drop zone is at root level
         if ($parentLi.size() == 0) {
            return '';
         }
         var parentEntry = new SitemapEntry($parentLi.get(0));
         
         if ($parentLi.length) {
            parentURL = parentEntry.getUrl();
         }
      } else {
         parentURL = dropzoneEntry.getUrl();
      }
      return parentURL;
   }
   
   
   /**
    * Event-handler for droppable drop-event dragging within tree.
    *
    * @param {Object} e event
    * @param {Object} ui ui-object
    */
   var dropItem = cms.sitemap.dropItem = function(e, ui) {
      if (dragStatus == MENU_DRAG) {
         return dropItemMenu.apply(this, [e, ui]);
      }
      // target item
      var $dropzone = $(this);
      var $dragged = ui.draggable;
      if ($dropzone.attr('id') == 'favorite-drop-list') {
         _dropItemIntoFavorites(e, ui, $dropzone);
         return;
      }
      shouldSaveRecent = true;
      var li = $(this).parent();
      var dropzoneEntry = new SitemapEntry(li.get(0));
      var formerParent = ui.draggable.parent();
      var draggedEntry = new SitemapEntry($dragged.get(0));
      // if the former parent li and the target li are not the same
      // and the former parent is going to lose it's last child 
      // (the currently dragged item will appear twice, once as the original and once as the ui-helper),
      // set the removeFormerParent flag
      var parentUl = null;
      if ($dropzone.hasClass(dropzoneClass)) {
         parentUl = li.closest('ul').get(0);
      } else {
         parentUl = li.children('ul').get(0);
      }
      var sameParent = parentUl == formerParent.get(0);
      
      formerParent.parent().css('border')
      var removeFormerParent = (li.get(0) != formerParent.parent().get(0) && formerParent.children().length == 2);
      var $reactivateButtonLocal = $reactivateButton;
      $reactivateButton = null;
      var _resetMenu = function() {
         if ($reactivateButtonLocal) {
            $reactivateButtonLocal.trigger('click');
         }
      }
      var _completeDrop = function() {
         if ($dropzone.hasClass(dropzoneClass)) {
            // dropping over dropzone, so insert before
            li.before($dragged);
         } else {
            // dropping over item, so insert into child-ul
            if (li.children('ul').length == 0) {
               // no child-ul present yet
               li.append('<ul/>');
               li.children('div.' + dropzoneClass).after(openerHtml);
            }
            li.removeClass(classClosed);
            li.children('ul').append($dragged);
         }
         setSitemapChanged(true);
         draggedEntry.setUrls(_getDropzoneParentUrl($dropzone));
         // remove the now empty former parent ul and the opener span
         if (removeFormerParent) {
            formerParent.siblings('span.' + classOpener).andSelf().remove();
         }
         $dropzone.removeClass(classHovered);
         $dropzone.trigger('cms-sitemap-structure-change');
      }
      var li = $(this).parent();
      var duplicateStatus = checkDuplicateOnDrop($dragged, $(this));
      if (!sameParent && duplicateStatus.duplicate) {
         var otherUrlNames = duplicateStatus.otherUrlNames;
         showEntryEditor(draggedEntry, true, otherUrlNames, false, function(newTitle, newUrlName, path, newProperties) {
            var previousUrl = draggedEntry.getUrl();
            var parentUrl = previousUrl.substring(0, previousUrl.lastIndexOf('/'));
            draggedEntry.setUrls(parentUrl);
            _completeDrop();
            _resetMenu();
            
         }, function() {
            $dropzone.removeClass(classHovered);
            _resetMenu();
            return;
         });
      } else {
         _completeDrop();
         _resetMenu();
      }
   }
   
   /**
    * Helper function for extracting a resource name from a path.
    * @param {Object} path
    */
   var _getResourceNameFromPath = function(path) {
      path = '/' + path;
      var slashPos = path.lastIndexOf('/');
      return path.substring(slashPos + 1);
   }
   
   /**
    * Converts a dragged item to the element which should be inserted into the drop target.
    *
    * This is necessary because the items in the gallery result list are not normal sitemap entries.
    * @param {Object} $draggable
    */
   var _convertToDropForm = function($draggable, callback) {
      var isGalleryItem = $draggable.hasClass('cms-gallery-item');
      var isGalleryType = $draggable.hasClass('cms-gallery-type');
      var isNewItem = $draggable.hasClass('cms-new-sitemap-entry');
      if (isGalleryItem) {
         // drag from search results
         var elementData = $draggable.data('elementData');
         var path = elementData.path;
         var name = _getResourceNameFromPath(path);
         var urlName = _removeExtension(name);
         
         var newEntry = {
            linkId: elementData.clientid,
            title: elementData.title || M.GUI_SITEMAP_ENTRY_NO_TITLE_0,
            properties: {},
            name: urlName,
            id: ''
         };
         
         cms.data.addContent([newEntry], function(ok, data) {
            if (!ok) {
               callback(null);
               return;
            }
            var filledEntry = data.entries[0];
            var $sitemapElement = _buildSitemapElement(filledEntry);
            $sitemapElement.find(cms.util.format('.{0}, .{1}', dropzoneClass, itemClass)).droppable(cms.sitemap.dropOptions);
            var entryObj = new SitemapEntry($sitemapElement);
            entryObj.makeEditableRecursively();
            callback($sitemapElement);
         });
      } else if (isGalleryType) {
         // drag from type menu in gallery
         var type = $draggable.data('typeData');
         var typeName = type.type;
         cms.data.createEntry(typeName, function(ok, data) {
            if (!ok) {
               callback(null);
               return;
            }
            var entry = data.entry;
            var $sitemapElement = _buildSitemapElement(entry);
            $sitemapElement.find(cms.util.format('.{0}, .{1}', dropzoneClass, itemClass)).droppable(cms.sitemap.dropOptions);
            callback($sitemapElement);
         });
      } else {
         callback($draggable.clone());
      }
   }
   
   
   
   
   /**
    * Event handler for droppable drop-event dragging from menu into tree.
    *
    * @param {Object} e event
    * @param {Object} ui ui-object
    */
   var dropItemMenu = cms.sitemap.dropItemMenu = function(e, ui) {
      var $dropzone = $(this);
      var li = $dropzone.parent();
      var $dropClone = _convertToDropForm(ui.draggable, function($dropClone) {
         if (!$dropClone) {
            $dropzone.removeClass(classHovered);
            return;
         }
         _addOpenerAndDropzone($dropClone);
         $dropClone.removeClass(classSubtree);
         var parentURL = '';
         var dropEntry = new SitemapEntry($dropClone.get(0));
         var dropId = dropEntry.getId();
         var $reactivateButtonLocal = $reactivateButton;
         $reactivateButton = null;
         var _resetMenu = function() {
            if ($reactivateButtonLocal) {
               $reactivateButtonLocal.trigger('click');
            }
         }
         
         var startsWith = function(str, prefix) {
            return prefix.length < str.length && str.substr(0, prefix.length)
         }
         
         var removeRecentEntry = function($clone) {
            var index = parseInt($clone.attr('sitemapIndex'));
            cms.sitemap.recent.splice(index, 1);
            cms.data.saveRecent(function(ok, data) {
                        });
         }
         
         var _completeDrop = function() {
            var dropEntry = new SitemapEntry($dropClone.get(0));
            if ($dropzone.hasClass(dropzoneClass)) {
               // dropping over dropzone, so insert before
               li.before($dropClone);
               var parentLi = li.parent().closest('li');
               if (parentLi.length) {
                  var entry = new SitemapEntry(parentLi);
                  parentURL = entry.getPrefixUrl();
               }
            } else {
               // dropping over item, so insert into child-ul
               if (li.children('ul').length == 0) {
                  // no child-ul present yet
                  li.append('<ul/>');
                  li.children('div.' + dropzoneClass).after(openerHtml);
               }
               li.removeClass(classClosed);
               li.children('ul').append($dropClone);
               var entry = new SitemapEntry(li);
               parentURL = entry.getPrefixUrl();
            }
            $dropClone.find('div.cms-handle').remove();
            $dropClone.find('div.' + itemClass).removeClass(dragClass);
            dropEntry.setUrls(parentURL);
            dropEntry.makeEditable();
            $dropzone.removeClass(classHovered);
            setSitemapChanged(true);
            // refresh droppable
            $('div.' + itemClass + ', div.' + dropzoneClass).droppable('destroy');
            $(dropSelector).droppable(cms.sitemap.dropOptions);
            $dropClone.find('.' + classSitemapEntry).andSelf().draggable(cms.sitemap.dragOptions);
            if (isDragFromRecent) {
               removeRecentEntry($dropClone);
            }
         }
         
         var duplicateStatus = checkDuplicateOnDrop($dropClone, $dropzone);
         if (duplicateStatus.duplicate || ui.draggable.hasClass('cms-new-sitemap-entry')) {
            var otherUrlNames = duplicateStatus.otherUrlNames;
            showEntryEditor(dropEntry, true, otherUrlNames, false, function(newTitle, newUrlName, newPath, newProperties) {
               cms.data.createEntry('containerpage', function(ok, data) {
                  if (!ok) {
                     return;
                  }
                  var $newElement = _buildSitemapElement(data.entry);
                  var newEntryObj = new SitemapEntry($newElement);
                  newEntryObj.setTitle(newTitle);
                  newEntryObj.setUrlName(newUrlName);
                  newEntryObj.setProperties(newProperties);
                  $dropClone = $newElement;
                  _completeDrop();
                  _resetMenu();
                  
               });
            }, function() {
            
               $dropzone.removeClass(classHovered);
               
               _resetMenu();
               return;
            });
         } else {
            _completeDrop();
            _resetMenu();
         }
      });
   }
   
   
   
   
   
   
   
   
   
   
   /**
    * Click-handler to edit the item title and properties for this handler.
    *
    */
   var editPage = function() {
      var itemDiv = $(this).closest('div.' + itemClass);
      var $entry = itemDiv.closest('li');
      var currentEntry = new SitemapEntry($entry.get(0));
      var $ul = $entry.closest('ul');
      var otherUrlNames = _getOtherUrlNames($ul, $entry.get(0));
      showEntryEditor(currentEntry, true, otherUrlNames, true, function(newTitle, newUrlName, newPath, newProperties) {
         var previousUrl = currentEntry.getUrl();
         var parentUrl = previousUrl.substring(0, previousUrl.lastIndexOf('/'));
         currentEntry.setUrls(parentUrl)
         setSitemapChanged(true);
      });
   }
   
   /**
    * Returns the URL names of the sitemap entries inside a given ul  which are not identical to a given entry
    * @param {Object} $ul the ul from which the url names should be retrieved
    * @param {Object} newItem the DOM element for which the URL name shouldn't be included in the result
    * @return an object containing the collected url names as properties (which all have the value true)
    **/
   var _getOtherUrlNames = function($ul, newItem) {
      var result = {};
      $ul.children('li').each(function() {
         if (this != newItem) {
            result[$(this).find('.cms-url-name:first').attr('alt')] = true;
         }
      });
      return result;
   }
   
   /**
    * Merges a set of property definition with a set of properties
    *
    * @param {Object} propDefs object containing the property definitions
    * @param {Object} properties object containing the properties
    *
    **/
   var mergePropertiesWithDefinitions = function(propDefs, properties) {
      var result = JSON.parse(JSON.stringify(propDefs));
      for (var key in result) {
         if (properties.hasOwnProperty(key)) {
            result[key].value = properties[key];
         }
      }
      return result;
   }
   
   /**
    * Checks whether a given sitemap entry is the last remaining entry at the root level of the sitemap.
    * @param {Object} $entry the entry which should be checked
    */
   var isLastRootEntry = function($entry) {
      var $parent = $entry.parent();
      return $parent.attr('id') == sitemapId && $parent.children().size() == 1;
   }
   
   
   
   /**
    * Initializes the sitemap editor.<p>
    */
   var initSitemap = cms.sitemap.initSitemap = function() {
      // setting options for draggable and sortable for dragging within tree
      cms.sitemap.dragOptions = {
         handle: '.cms-sitemap-entry-header, .cms-handle a.cms-move',
         opacity: 0.8,
         addClasses: false,
         helper: 'clone',
         zIndex: 11000,
         start: cms.sitemap.startDrag,
         stop: cms.sitemap.stopDrag
      };
      if ($.browser.msie) {
         // If no handle is set, dragging in IE triggers the startDrag function for all parents of the dragged element
         cms.sitemap.dragOptions.handle = ' > div.' + itemClass + '> div.cms-handle > a.cms-move'
      }
      cms.sitemap.dropOptions = {
         accept: 'li',
         tolerance: 'pointer',
         greedy: true,
         drop: cms.sitemap.dropItem,
         over: cms.sitemap.overDrop,
         out: cms.sitemap.outDrop
      };
      
      // setting options for draggable and sortable for dragging from menu to tree
      cms.sitemap.dragOptionsMenu = $.extend({}, cms.sitemap.dragOptions, {
         start: cms.sitemap.startDragMenu,
         stop: cms.sitemap.stopDragMenu
      });
      
      cms.sitemap.dragOptionsRecent = $.extend({}, cms.sitemap.dragOptionsMenu, {
         start: cms.sitemap.startDragRecent
      });
      
      cms.sitemap.dragOptionsNew = $.extend({}, cms.sitemap.dragOptionsMenu, {
         start: cms.sitemap.startDragNew
      });
      
      
      cms.sitemap.dragOptionsGallery = $.extend({}, cms.sitemap.dragOptionsMenu, {
         start: cms.sitemap.startDragGallery
         //    handle: '.cms-move'
      
      });
      cms.sitemap.dragOptionsType = $.extend({}, cms.sitemap.dragOptionsMenu, {
         start: cms.sitemap.startDragGallery
      });
      
      
      
      
      cms.sitemap.dropOptionsMenu = $.extend({}, cms.sitemap.dropOptions, {
         drop: cms.sitemap.dropItemMenu
      });
      
      $('#' + sitemapId).children().each(function() {
         // TODO: check if this is wrong for non-root sitemaps
         (new SitemapEntry(this)).setUrls('');
      });
      var canEdit = !cms.data.NO_EDIT_REASON && cms.data.DISPLAY_TOOLBAR;
      if (cms.data.DISPLAY_TOOLBAR) {
         // generating toolbar
         cms.sitemap.dom.toolbar = $(cms.html.toolbar).appendTo(document.body);
         cms.sitemap.dom.toolbarContent = $('#toolbar_content', cms.sitemap.dom.toolbar);
         
         cms.sitemap.currentMode = null;
         //create buttons:
         for (i = 0; i < sitemapModes.length; i++) {
            sitemapModes[i].create(canEdit).appendTo(cms.sitemap.dom.toolbarContent);
         }
         cms.sitemap.dom.favoriteDrop.css({
            top: '35px',
            left: $('button[name="favorites"]').position().left - 1 + 'px'
         });
         
         // preparing tree for drag and drop
         //$('#' + sitemapId + ' li:has(ul)').prepend(openerHtml);
         //$('#' + sitemapId + ' li').prepend('<div class="' + dropzoneClass + '"></div>')
      }
      
      // assigning event-handler
      $('#' + sitemapId + ' span.' + classOpener).live('click', function() {
         $(this).parent().toggleClass(classClosed);
      });
      if (canEdit) {
         //         $('a.cms-delete').live('click', deletePage);
         //         $('a.cms-new').live('click', newPage);
         //         $('a.cms-edit').live('click', editPage);
         $('#' + sitemapId + ' .cms-sitemap-entry:not(.cms-sub-sitemap-ref) > div.' + itemClass + ' h3').directInput({
            marginHack: true,
            live: true,
            valueChanged: function() {
               setSitemapChanged(true);
            },
            readValue: function(elem) {
               return elem.attr('title');
            },
            
            setValue: function(elem, input) {
               var previous = elem.attr('title');
               var current = input.val();
               if (previous != current) {
                  elem.text(abbreviateTitle(current, 250));
                  elem.attr('title', current);
               }
               elem.css('display', '');
               input.remove();
               
            },
            formatInput: function($elem, $input) {
               $input.css({
                  'border': '1px solid black',
                  'width': '260px',
                  'background-color': 'white',
                  'height': '19px',
                  'padding-top': '2px'
               
               
               });
               $input.addClass('ui-corner-all');
               
               
            },
            
            testEnabled: testCanEditTitles
         });
         
         //         $(urlNameDirectInputSelector).directInput({
         //            marginHack: true,
         //            live: true,
         //            readValue: function(elem) {
         //               return elem.attr('alt');
         //            },
         //            setValue: directInputSetUrlName,
         //            valueChanged: function() {
         //               setSitemapChanged(true);
         //            }
         //         });
         //         $('.cms-sitemap-item input.cms-url-name').change(function() {
         //            var newValue = $(elem).val();
         //            //**
         //         });
         
         $('#fav-edit').click(_editFavorites);
         $(window).unload(onUnload);
      }
      
      $('.cms-icon-triangle').live('click', function() {
         $(this).closest('.' + itemClass).toggleClass(classAdditionalShow);
         var menu = $(this).closest('.cms-menu');
         if (menu.length) {
            adjustMenuShadow(menu);
         }
      });
      $('#' + sitemapId).children('li').each(function() {
         var entry = new SitemapEntry(this);
         entry.openRecursively(true, 2);
      });
      
      $('.cms-item a.ui-icon').live('click', toggleAdditionalInfo);
   }
   
   /**
    * Initializes the drag functionality for elements from the galleries' result list.
    *
    * @param {Object} elementData the data for the given result element
    * @param {jQuery} $element the DOM element which should be prepared for dragging
    */
   var initDragForGallery = cms.sitemap.initDragForGallery = function(elementData, $element) {
      $element.addClass('cms-gallery-item');
      $element.data('elementData', elementData);
      $element.draggable(cms.sitemap.dragOptionsGallery);
   }
   
   /**
    * Initializes the drag functionality for elements from the galleries' type menu.
    *
    * @param {Object} type the data describing the type.
    * @param {Object} $typeElement the DOM element which should be prepared for dragging.
    */
   var initDragForGalleryType = cms.sitemap.initDragForGalleryType = function(type, $typeElement) {
      // disabled for now, the user should use the New menu or the New handle button
   
      //$typeElement.addClass('cms-gallery-type');
      //$typeElement.data('typeData', type);
      //$typeElement.draggable(cms.sitemap.dragOptionsType);
   }
   
   
   /**
    * Adds drag and drop to tree.
    *
    */
   var initDraggable = cms.sitemap.initDraggable = function() {
      $(dropSelector + ', #favorite-drop-list').droppable(cms.sitemap.dropOptions);
      $('#' + sitemapId + ' li').draggable(cms.sitemap.dragOptions);
   }
   
   /**
    * Generates a confirm-dialog to keep subpages when dragging from tree to favorites.
    *
    * @param {Object} dragClone the item to be added to favorites
    * @param {Function} callback the function that should be called after the dialog is finished
    */
   var keepTree = cms.sitemap.keepTree = function(dragClone, callback) {
      var $dialog = $('<div id="cms-alert-dialog" style="display: none"></div>');
      $dialog.appendTo('body');
      $dialog.append('<p style="margin-bottom: 4px;">' + M.SITEMAP_CONFIRM_MOVE_TO_FAV_LINE1 + '<br />' + M.SITEMAP_CONFIRM_MOVE_TO_FAV_LINE2 + '</p>');
      var buttons = {};
      buttons[M.SITEMAP_BUTTON_CONFIRM_MOVE_TO_FAV_KEEP_SUBPAGES] = function() {
         dragClone.addClass(classSubtree);
         $dialog.dialog('destroy');
         $dialog.remove();
         callback();
         
      }
      
      buttons[M.SITEMAP_BUTTON_CONFIRM_MOVE_TO_FAV_LOSE_SUBPAGES] = function() {
         dragClone.find('ul').remove();
         dragClone.find('span.' + classOpener).remove();
         $dialog.dialog('destroy');
         $dialog.remove();
         callback();
      }
      
      $dialog.dialog({
         zIndex: 9999,
         title: 'Favorites',
         modal: true,
         close: function() {
            callback();
            return false;
         },
         
         buttons: buttons
      
      });
   }
   
   /**
    * Creates a short menu bar button.
    * @param {Object} name the button name
    * @param {Object} title the button title
    * @param {Object} cssClass the css class to add to the button
    */
   var makeModeButton = function(name, title, cssClass) {
      return $('<button name="' + name + '" title="' + title + '" class="cms-left ui-state-default ui-corner-all"><span class="ui-icon ' + cssClass + '"></span>&nbsp;</button>');
   }
   
   /**
    * Creates a wide menu bar button.
    * @param {Object} name the button name
    * @param {Object} title the button title
    * @param {Object} cssClass the css class to add to the button
    */
   var makeWideButton = function(name, title, cssClass) {
      return $('<button name="' + name + '" title="' + title + '" class="cms-left cms-button-wide ui-state-default ui-corner-all"><span class="ui-icon ' + cssClass + '"></span><span class="cms-button-text">' + title + '</span></button>');
   };
   
   /**
    * Creates html code for sitemap items in the 'New' menu.
    *
    * @param {Object} title item-title
    */
   var createNewItem = function(title) {
      return _buildSitemapElement(cms.sitemap.models[0]);
   }
   
   
   /**
    * Click-handler to create a new sub-page. Opening an edit dialog for title and properties.
    */
   var newPage = function() {
      var button = this;
      var entry = cms.sitemap.models[0];
      var $parentElement = $(button).closest('li');
      var parentEntry = new SitemapEntry($parentElement);
      var otherUrlNames = _getOtherUrlNames($(button).closest('li').children('ul'));
      showEntryEditor(new SitemapEntry(_buildSitemapElement(entry)), false, otherUrlNames, false, function(newTitle, newUrlName, newPath, newProperties) {
         cms.data.createEntry('containerpage', function(ok, data) {
            if (!ok) {
               return;
            }
            var $sitemapElement = _buildSitemapElement(data.entry);
            var entryObj = new SitemapEntry($sitemapElement.get(0));
            entryObj.makeEditable();
            $sitemapElement.find(cms.util.format('.{0}, .{1}', dropzoneClass, itemClass)).droppable(cms.sitemap.dropOptions);
            addHandles($sitemapElement.children('.' + itemClass), sitemapModes);
            entryObj.setProperties(newProperties);
            entryObj.setPath(newPath);
            entryObj.setUrlName(newUrlName);
            entryObj.setTitle(newTitle);
            
            var $currentEntryUl = $parentElement.children('ul');
            if ($currentEntryUl.size() == 0) {
               $currentEntryUl = $('<ul/>').appendTo($(button).closest('li'));
            }
            $parentElement.removeClass(classClosed);
            $currentEntryUl.append($sitemapElement);
            var parentURL = parentEntry.getPrefixUrl();
            entryObj.setUrls(parentURL);
            addHandles($sitemapElement.children('div.' + itemClass), sitemapModes);
            $sitemapElement.draggable(cms.sitemap.dragOptions);
            setSitemapChanged(true);
            
         });
      }, function() {
            // cancel edit dialog, do nothing
      });
   };
   
   
   /**
    * Event-handler for droppable out-event.
    *
    * @param {Object} e event
    * @param {Object} ui ui-object
    */
   var outDrop = cms.sitemap.outDrop = function(e, ui) {
      if ($(this).is('#favorite-drop-list')) {
         $('.ui-droppable:not(#favorite-drop-list)').droppable('enable');
      }
      $(this).removeClass(classHovered);
      if (cms.sitemap.dom.currentMenu) {
         $('li', cms.sitemap.dom.currentMenu).draggable('option', 'refreshPositions', false);
      } else {
         $('#' + sitemapId + ' li').draggable('option', 'refreshPositions', false);
         if ($(this).attr('id') == 'favorite-drop-list') {
            ui.helper.removeClass(classForceClosed);
         }
      }
   }
   
   /**
    * Event-handler for droppable over-event.
    *
    * @param {Object} e event
    * @param {Object} ui ui-object
    */
   var overDrop = cms.sitemap.overDrop = function(e, ui) {
      if ($(this).is('#favorite-drop-list')) {
         $('.ui-droppable:not(#favorite-drop-list)').droppable('disable');
      }
      $(this).addClass(classHovered);
      if ($(this).hasClass(itemClass)) {
         $(this).closest('.' + classClosed).removeClass(classClosed);
         if (cms.sitemap.dom.currentMenu) {
            $('li', cms.sitemap.dom.currentMenu).draggable('option', 'refreshPositions', true);
         } else {
            $('#' + sitemapId + ' li').draggable('option', 'refreshPositions', true);
         }
      } else if ($(this).attr('id') == 'favorite-drop-list') {
         ui.helper.addClass(classForceClosed);
      }
   }
   
   /**
    * Sets the value from input to element.
    *
    * @param {Object} elem the element
    * @param {Object} input the input-element
    */
   var setDirectValue = function(elem, input, changeValue) {
      var oldValue = input.val();
      changeValue(oldValue, function(newValue) {
         elem.text(newValue).css('display', 'block');
         input.remove();
      })
   }
   
   var setInfoValue = cms.sitemap.setInfoValue = function(elem, value, maxLength, showEnd) {
      elem.attr('title', value);
      var valueLength = value.length;
      if (valueLength > maxLength) {
         var shortValue = showEnd ? '... ' + value.substring(valueLength - maxLength + 5) : value.substring(0, maxLength - 5) + ' ...';
         elem.text(shortValue);
      } else {
         elem.text(value);
      }
   }
   
   
   /**
    * Event-handler for draggable start-event dragging within tree.
    *
    * @param {Object} e event
    * @param {Object} ui ui-object
    */
   var startDrag = cms.sitemap.startDrag = function(e, ui) {
      var $favButton = $('button[name=favorites]');
      $reactivateButton = $('#toolbar_content > button.ui-state-active');
      $reactivateButton.trigger('click');
      
      //$('input', this).blur();
      $('.cms-hovering').remove();
      $('div.' + itemClass, this).addClass(dragClass);
      
      $('div.cms-handle', ui.helper).removeClass('ui-widget-header').css({
         'width': '24px',
         'right': '0px',
         'display': 'block'
      }).children().removeClass('ui-corner-all ui-state-default').not('a.cms-move').css('display', 'none');
      cms.sitemap.dom.favoriteDrop.css('display', 'block');
      dragStatus = NORMAL_DRAG;
   }
   
   /**
    * Event-handler for draggable start-event dragging from menu into tree.
    *
    * @param {Object} e event
    * @param {Object} ui ui-object
    */
   var startDragMenu = cms.sitemap.startDragMenu = function(e, ui) {
      //$(ui.helper).addClass(dragClass);
      $('div.' + itemClass, this).addClass(dragClass);
      var oldOffset = cms.util.getElementPosition($(this));
      var width = $(this).width();
      
      ui.helper.appendTo(cms.sitemap.dom.currentMenu);
      ui.helper.addClass('cms-dragged-menu-item');
      var newOffset = cms.util.getElementPosition(ui.helper);
      var newPos = ui.helper.position();
      ui.helper.width(width);
      cms.sitemap.dom.currentMenu.children('div').css('display', 'none');
      dragStatus = MENU_DRAG;
      isDragFromRecent = true;
   }
   
   /**
    * Event-handler for draggable start-event dragging from menu into tree.
    *
    * @param {Object} e event
    * @param {Object} ui ui-object
    */
   var startDragRecent = cms.sitemap.startDragRecent = function(e, ui) {
      //$(ui.helper).addClass(dragClass);
      $('div.' + itemClass, this).addClass(dragClass);
      var oldOffset = cms.util.getElementPosition($(this));
      var width = $(this).width();
      
      ui.helper.appendTo(cms.sitemap.dom.currentMenu);
      ui.helper.addClass('cms-dragged-menu-item');
      var newOffset = cms.util.getElementPosition(ui.helper);
      var newPos = ui.helper.position();
      ui.helper.width(width);
      cms.sitemap.dom.currentMenu.children('div').css('display', 'none');
      dragStatus = MENU_DRAG;
      isDragFromRecent = true;
   }
   
   
   
   
   
   /**
    * Drag start handler for dragging from the 'New' menu
    * @param {Object} e
    * @param {Object} ui
    */
   var startDragNew = cms.sitemap.startDragNew = function(e, ui) {
      $(this).addClass('cms-new-sitemap-entry');
      return startDragMenu.apply(this, [e, ui]);
   }
   
   /**
    * Event handler for draggable start-event dragging from the gallery menu.
    *
    * @param {Object} e
    * @param {Object} ui
    */
   var startDragGallery = cms.sitemap.startDragGallery = function(e, ui) {
      $('div.' + itemClass, this).addClass(dragClass);
      var width = $(this).width();
      // attach the dragged element to a container element so that it stays visible when we hide
      // the menu. The container element is placed at the same position as the original element's offset
      // parent so that the element doesn't "jump" when the drag process starts.
      var $newParent = _getGalleryHelperContainer();
      $newParent.empty();
      // Necessary because IE messes up the position on the first 
      $('body').offset();
      
      var oldOffset = cms.util.getElementPosition($(this).offsetParent());
      
      var $op = $(this).offsetParent();
      var $ulOp = $op.offsetParent();
      $newParent.css({
         'position': 'absolute',
         'left': oldOffset.left,
         'top': oldOffset.top,
         'width': '1px',
         'height': '1px'
      });
      
      if ($.browser.msie) {
         // In IE, the helper position isn't updated correctly,
         // so we move the helper by the difference between its actual position and the coordinates of the mousemove event.
         // We put the event handler in a variable to be able to remove it later.
         updateGalleryDragPosition = function(e) {
            var hOffset = ui.helper.offset();
            var hPos = ui.helper.position();
            var px = e.pageX;
            var py = e.pageY;
            var dy = py - hOffset.top;
            var dx = px - hOffset.left;
            ui.helper.css('top', hPos.top + dy - 20);
            ui.helper.css('left', hPos.left + dx - ui.helper.width() + 20);
         };
         $(document).mousemove(updateGalleryDragPosition);
      }
      ui.helper.find('.cms-list-checkbox').remove();
      ui.helper.appendTo($newParent);
      
      ui.helper.addClass('cms-gallery-item');
      var $listItem = ui.helper.children('.cms-list-item:first');
      $listItem.width(width);
      
      cms.sitemap.dom.currentMenu.children('div').css('display', 'none');
      dragStatus = MENU_DRAG;
   }
   
   /**
    * Event-handler for draggable stop-event dragging within tree.
    *
    * @param {Object} e event
    * @param {Object} ui ui-object
    */
   var stopDrag = cms.sitemap.stopDrag = function(e, ui) {
      $('.ui-droppable').droppable('enable');
      $('.cms-hovered').removeClass('cms-hovered');
      $('div.' + itemClass, this).removeClass(dragClass);
      $('.' + itemClass, this).find('.cms-handle > *').css('display', 'block');
      var dragClone = $(this).clone();
      dragClone.find('div.cms-handle').remove();
      dragClone.find('ul').remove();
      dragClone.find('span.' + classOpener).remove();
      
      var sitemapEntry = new SitemapEntry(dragClone.get(0));
      $('div.cms-handle').css('display', 'block');
      cms.sitemap.dom.favoriteDrop.css('display', 'none');
      setSitemapChanged(true);
      dragStatus = NO_DRAG;
      
      if ($reactivateButton) {
         // drop was cancelled, because dropItem clears the reactivateFavorites flag
         $reactivateButton.trigger('click');
         $reactivateButton = null;
      }
   }
   
   /**
    * Event-handler for draggable stop-event dragging from menu into treetree.
    *
    * @param {Object} e event
    * @param {Object} ui ui-object
    */
   var stopDragMenu = cms.sitemap.stopDragMenu = function(e, ui) {
      if (updateGalleryDragPosition) {
         // remove "workaround" event handler for galleries in IE
         // (see the startDragGallery function)
         $(document).unbind('mousemove', updateGalleryDragPosition);
      }
      
      $('div.' + itemClass, this).removeClass(dragClass);
      //$(ui.helper).removeClass(dragClass);
      cms.sitemap.dom.currentMenu.children('div').css('display', 'block');
      // refresh droppable
      $('div.' + itemClass + ', div.' + dropzoneClass).droppable('destroy');
      $(dropSelector).droppable(cms.sitemap.dropOptions);
      setSitemapChanged(true);
      dragStatus = NO_DRAG;
      cms.sitemap.currentMode.disable();
      cms.sitemap.currentMode = null;
   }
   
   
   var dom = {}
   var galleryInitialized = false;
   
   var GalleryMode = {
      name: 'add',
      title: M.SITEMAP_MODE_ADD,
      wide: true,
      floatRight: false,
      create: createButton,
      
      menuId: cms.html.galleryMenuId,
      create: createButton,
      
      load: function(callback) {
         if (!galleryInitialized) {
            galleryInitialized = true;
            cms.galleries.initValues['tabs'] = ['cms_tab_galleries', 'cms_tab_categories', 'cms_tab_search'];
            cms.galleries.initAddDialog();
         }
         callback();
      },
      /*  disable: _disableListMode,
       enable: _enableListMode, */
      init: function() {
         cms.sitemap.dom.addMenu = $(cms.html.createGalleryMenu()).appendTo(cms.sitemap.dom.toolbarContent);
      },
      
      enable: function() {
         this.button.addClass('ui-state-active');
         cms.sitemap.dom.currentMenu = cms.sitemap.dom.addMenu.css({
            /* position : 'fixed', */
            top: 35,
            left: this.button.position().left - 1
         }).slideDown(100, function() {
            $('div.ui-widget-shadow', cms.sitemap.dom.addMenu).css({
               top: 0,
               left: -3,
               width: cms.sitemap.dom.addMenu.outerWidth() + 8,
               height: cms.sitemap.dom.addMenu.outerHeight() + 1,
               border: '0px solid',
               opacity: 0.6
            });
         });
         $(dropSelector).droppable(cms.sitemap.dropOptions);
      },
      
      disable: function() {
         this.button.removeClass('ui-state-active');
         
         cms.sitemap.dom.addMenu.css('display', 'none');
         cms.sitemap.dom.currentMenu = null;
      }
      
   }
   
   /**
    * Goes to a given URL, but asks the user first whether he wants to save if the sitemap has changed.
    *
    * @param {Object} target the target URL
    */
   var goToPage = function(target) {
      if (sitemapChanged) {
         cms.util.leavePageDialog(target, function(callback) {
            var sitemap = serializeSitemap($('#' + sitemapId));
            cms.data.saveSitemap(sitemap, callback);
         }, function() {
            if (sitemapChanged) {
               sitemapChanged = false;
               cms.data.sitemapPostJSON('stopedit', {}, function() {
                  window.location.href = target;
               });
            } else {
               window.location.href = target;
            }
         });
      } else {
         window.location.href = target;
      }
      
   }
   
   var GoToPageMode = {
      name: 'gotopage',
      title: M.SITEMAP_MODE_GO_TO_PAGE,
      wide: false,
      create: createWithoutButton,
      enable: function() {
            },
      disable: function() {
            },
      
      createHandle: function(elem) {
      
         return $('<a class="cms-gotopage"></a>').attr('title', this.title);
      },
      
      init: function() {
         $('a.cms-gotopage').live('click', function() {
            var $entry = $(this).closest('.' + classSitemapEntry);
            var path = (new SitemapEntry($entry.get(0))).getUrl();
            var target = removeDuplicateSlashes(cms.data.CONTEXT + cms.sitemap.referencePath + path);
            goToPage(target);
         });
      }
   };
   
   var EntrySelectionArea = function(selector, selectionClass, callback) {
      var self = this;
      self.selector = selector;
      self.closeHandler = null;
      self.selectionClass = selectionClass;
      var html = ['<div class="cms-esa-box ui-dialog ui-widget ui-widget-content ui-corner-all">\
              <div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix" unselectable="on" style="-moz-user-select: none;">', M.SITEMAP_DIALOG_TITLE_SUBSITEMAP, '<span class="ui-dialog-title" id="ui-dialog-title-cms-leave-dialog" unselectable="on" style="-moz-user-select: none;"></span></div>\
              <div style="padding: 10px;">\
                  <span class="cms-esa-info">', M.SITEMAP_SELECT_SUBSITEMAP, '</span>\
                  <table class="cms-esa-title-and-path">\
                       <tr><td class="cms-esa-title-label">', M.SITEMAP_LABEL_SUBSITEMAP_TITLE, '</td><td class="cms-esa-title-value"></td></tr>\
                       <tr><td class="cms-esa-path-label">', M.SITEMAP_LABEL_SUBSITEMAP_PATH, '</td><td class="cms-esa-path-value"></td></tr>\
                   </table>\
                   <button class="cms-esa-ok ui-state-default ui-corner-all">', M.SITEMAP_BUTTON_CONVERT_TO_SUBSITEMAP_OK, '</button><button class="cms-esa-cancel ui-state-default ui-corner-all">', M.SITEMAP_BUTTON_CONVERT_TO_SUBSITEMAP_CANCEL, '</button>\
               </div>\
           </div>'];
      
      var $frame = $(html.join(''));
      
      self.$frame = $frame;
      self.selector = selector;
      self.selectFunction = function() {
         var $entry = $(this).closest('.' + classSitemapEntry);
         $('.' + self.selectionClass).removeClass(self.selectionClass);
         $entry.addClass(self.selectionClass);
         self.selectEntry($entry);
      };
      $(selector).live('click', self.selectFunction);
      $('.cms-esa-cancel', $frame).click(function() {
         self.destroy();
      });
      $('.cms-esa-ok', $frame).click(function() {
         callback(self.$entry);
         self.destroy();
      });
      canEditTitles = false;
   }
   
   
   EntrySelectionArea.prototype = {
      /**
       * Destroys the entry selection area
       */
      destroy: function() {
         var self = this;
         $(self.selector).die('click', self.selectFunction);
         this.$frame.remove();
         canEditTitles = true;
         if (self.closeHandler) {
            self.closeHandler();
         }
         $('.' + self.selectionClass).removeClass(self.selectionClass);
      },
      
      /**
       * Method that is called when an entry is selected
       *
       * @param {Object} $entry the selected entry
       */
      selectEntry: function($entry) {
      
         var self = this;
         var entryObj = new SitemapEntry($entry.get(0));
         self.setTitle(entryObj.getTitle());
         self.setPath(entryObj.getPath());
         self.$entry = $entry;
      },
      
      /**
       * Sets the title displayed in the entry selection area
       * @param {Object} title the new title
       */
      setTitle: function(title) {
         var self = this;
         self.$frame.find('.cms-esa-title-value').text(title).attr('alt', title);
      },
      
      /**
       * Sets the path dispalyed in the entry selection area
       * @param {Object} path the new path
       */
      setPath: function(path) {
         var self = this;
         self.$frame.find('.cms-esa-path-value').text(path).attr('alt', path).attr('title', path);
      },
      
      /**
       * Sets a function that will be called when the entry selection area is called
       *
       * @param {Object} handler the handler function
       */
      setCloseHandler: function(handler) {
         this.closeHandler = handler;
      }
      
      
      
   }
   
   /** Array of mode-objects. These correspond to the buttons shown in the toolbar. */
   var sitemapModes = [GoToPageMode, {
      // save mode
      name: 'save',
      title: M.SITEMAP_MODE_SAVE,
      wide: false,
      floatRight: false,
      create: createButton,
      enable: function() {
         if (!this.button.hasClass('cms-deactivated')) {
            this.button.addClass('ui-state-active');
            var $sitemapElem = $('#' + sitemapId);
            var sitemap = serializeSitemap($sitemapElem);
            cms.data.saveSitemap(sitemap, function(ok, data) {
               if (ok) {
                  setSitemapChanged(false);
               } else {
                  alert("error")
                  //display error message ? 
               }
            });
         }
      },
      disable: function() {
         this.button.removeClass('ui-state-active');
      },
      init: function() {
            }
   }, {
      // edit mode
      name: 'edit',
      title: M.SITEMAP_MODE_EDIT,
      wide: false,
      create: createWithoutButton,
      enable: function() {
            },
      disable: function() {
            },
      createHandle: function(elem) {
         var $entry = $(elem).closest('.' + classSitemapEntry);
         if ($entry.hasClass('cms-sub-sitemap-ref')) {
            return $([]);
         } else {
            return $('<a class="cms-edit cms-edit-enabled"></a>').attr('title', this.title);
         }
      },
      init: function() {
         $('a.cms-edit').live('click', editPage);
      }
   }, {
      // delete mode
      name: 'delete',
      title: M.SITEMAP_MODE_DELETE,
      wide: false,
      create: createWithoutButton,
      enable: function() {
            },
      disable: function() {
            },
      createHandle: function(elem) {
         var $entry = $(elem).closest('.' + classSitemapEntry);
         var e = new SitemapEntry($entry);
         if ($entry.parent().size() > 0 && $entry.parent().closest('.' + classSitemapEntry).size() == 0 &&
         $entry.siblings('.' + classSitemapEntry).filter(function(i, sibling) {
            return new SitemapEntry(sibling).getId() != e.getId();
         }).size() ==
         0) {
            // last toplevel entry, so we can't delete it
            return $([]);
         } else {
            return $('<a class="cms-delete"></a>').attr('title', this.title);
         }
      },
      init: function(canEdit) {
         if (canEdit) {
            $('a.cms-delete').live('click', deletePage);
         }
      }
   }, {
      name: 'subsitemap',
      title: M.SITEMAP_MODE_SUBSITEMAP,
      wide: false,
      create: createButton,
      enable: function() {
         var self = this;
         
         var convertToSubsitemap = function($element) {
            if (!$element) {
               cms.util.dialogAlert(M.SITEMAP_ERROR_SUBSITEMAP_SELECTION_EMPTY, M.SITEMAP_ERROR_SUBSITEMAP_SELECTION_ERROR_TITLE);
               return;
            }
            
            var entryObj = new SitemapEntry($element.clone());
            if (entryObj.isRootOfRootSitemap() || entryObj.getChildren().length == 0) {
               cms.util.dialogAlert(M.SITEMAP_ERROR_SUBSITEMAP_SELECTION_INVALID, M.SITEMAP_ERROR_SUBSITEMAP_SELECTION_ERROR_TITLE);
               return;
            }
            
            var sitemap = [entryObj.serialize(false)];
            // No url name for root of new sub-sitemap
            sitemap[0].name = '';
            
            cms.data.createSitemap(sitemap, entryObj.getTitle(), function(ok, data) {
               if (!ok) {
                  return;
               }
               
               var path = data.path;
               $element.children('ul').remove();
               $element.addClass(classClosed);
               $element.addClass('cms-sub-sitemap-ref');
               $element.children('.' + classOpener).remove();
               var entryObj = new SitemapEntry($element);
               entryObj.setSitemap(path);
               entryObj.setProperties({});
               setSitemapChanged(true);
            });
         }
         this.esa = new EntrySelectionArea('#' + sitemapId + ' .' + itemClass, 'cms-subsitemap-entry-selected', convertToSubsitemap);
         this.esa.setCloseHandler(function() {
            $('button[name=' + self.name + '].ui-state-active').trigger('click');
         });
         
         var boxOffset = $('#cms-main > .cms-box').offset();
         
         this.esa.$frame.appendTo('body');
         this.esa.$frame.css({
            top: boxOffset.top + 10,
            left: boxOffset.left + 603
         });
         this.esa.$frame.draggable();
         this.button.addClass('ui-state-active');
      },
      
      disable: function() {
         this.button.removeClass('ui-state-active');
         if (this.esa) {
            this.esa.destroy();
            this.esa = null;
         }
      },
      
      createHandle: function(elem) {
         return $([]);
      },
      init: function(canEdit) {
            }
   }, GalleryMode, {
      // new mode
      name: 'new',
      title: M.SITEMAP_MODE_NEW,
      wide: true,
      floatRight: false,
      create: createButton,
      enable: function() {
         this.button.addClass('ui-state-active');
         cms.sitemap.dom.currentMenu = cms.sitemap.dom.newMenu.css({
            /* position : 'fixed', */
            top: 35,
            left: this.button.position().left - 1
         }).slideDown(100, function() {
            $('div.ui-widget-shadow', cms.sitemap.dom.newMenu).css({
               top: 0,
               left: -3,
               width: cms.sitemap.dom.newMenu.outerWidth() + 8,
               height: cms.sitemap.dom.newMenu.outerHeight() + 1,
               border: '0px solid',
               opacity: 0.6
            });
         });
         //$(dropSelector).droppable('destroy');
         //$(dropSelector).droppable(cms.sitemap.dropOptionsMenu);
         $('#' + cms.html.newMenuId + ' li').draggable(cms.sitemap.dragOptionsNew);
      },
      disable: function() {
         this.button.removeClass('ui-state-active');
         
         cms.sitemap.dom.newMenu.css('display', 'none');
         cms.sitemap.dom.currentMenu = null;
      },
      createHandle: function(elem) {
         var $entry = $(elem).closest('.' + classSitemapEntry);
         if ($entry.hasClass('cms-sub-sitemap-ref')) {
            return $([]);
         } else {
            return $('<a class="cms-new"></a>').attr('title', this.title);
         }
      },
      init: function(canEdit) {
         if (canEdit) {
            $('a.cms-new').live('click', newPage);
         }
         
         cms.sitemap.dom.newMenu = $(cms.html.createMenu(cms.html.newMenuId)).appendTo(cms.sitemap.dom.toolbarContent);
         for (var i = 0; i < cms.sitemap.models.length; i++) {
            var model = cms.sitemap.models[i];
            cms.sitemap.dom.newMenu.find('ul').append(_buildSitemapElement(model));
         }
         if ($.browser.msie) {
            // vertical spacer
            $('<div/>').css('height', '1px').insertAfter(cms.sitemap.dom.newMenu.find('.cms-scrolling'));
         }
         
      }
   }, {
      // move mode
      name: 'move',
      title: M.SITEMAP_MODE_MOVE,
      wide: false,
      create: createWithoutButton,
      enable: function() {
            },
      disable: function() {
            },
      createHandle: function() {
         return $('<a class="cms-move"></a>').attr('title', this.title);
      },
      init: function() {
            }
   }, {
      // favorites mode
      name: 'favorites',
      title: M.SITEMAP_MODE_FAVORITES,
      wide: true,
      floatRight: false,
      create: createButton,
      enable: function() {
         this.button.addClass('ui-state-active');
         cms.sitemap.dom.currentMenu = cms.sitemap.dom.favoriteMenu.css({
            /* position : 'fixed', */
            top: 35,
            left: this.button.position().left - 1
         }).slideDown(100, function() {
            var heightDiff = 1;
            $('div.ui-widget-shadow', cms.sitemap.dom.favoriteMenu).css({
               top: 0,
               left: -3,
               width: cms.sitemap.dom.favoriteMenu.outerWidth() + 8,
               height: cms.sitemap.dom.favoriteMenu.outerHeight() + heightDiff,
               border: '0px solid',
               opacity: 0.6
            });
         });
         //unnecessary 
         //$(dropSelector).droppable(cms.sitemap.dropOptionsMenu);
         $('#' + cms.html.favoriteMenuId + ' li').draggable(cms.sitemap.dragOptionsMenu);
      },
      disable: function() {
         this.button.removeClass('ui-state-active');
         
         cms.sitemap.dom.favoriteMenu.css('display', 'none');
         cms.sitemap.dom.currentMenu = null;
      },
      init: function() {
         cms.sitemap.dom.favoriteMenu = $(cms.html.createMenu(cms.html.favoriteMenuId)).appendTo(cms.sitemap.dom.toolbarContent);
         if ($.browser.msie) {
            // vertical spacer
            $('<div/>').css('height', '1px').insertAfter(cms.sitemap.dom.favoriteMenu.find('.cms-scrolling'));
         }
         cms.sitemap.dom.favoriteDrop = $(cms.html.createFavDrop()).appendTo(cms.sitemap.dom.toolbarContent);
         cms.sitemap.dom.favoriteList = cms.sitemap.dom.favoriteMenu.find('ul');
      },
      
      load: function(callback) {
         cms.data.loadFavorites(function(ok, data) {
            if (!ok) {
               return;
            }
            var favorites = data.favorites;
            $('#favorite_list_items').empty();
            var $favContent = buildSitemap(favorites).appendTo('#favorite_list_items');
            callback();
         });
      }
   }, {
      // recent mode
      name: 'recent',
      title: M.SITEMAP_MODE_RECENT,
      wide: true,
      floatRight: false,
      create: createButton,
      enable: function() {
         this.button.addClass('ui-state-active');
         cms.sitemap.dom.currentMenu = cms.sitemap.dom.recentMenu.css({
            /* position : 'fixed', */
            top: 35,
            left: this.button.position().left - 1
         }).slideDown(100, function() {
            $('div.ui-widget-shadow', cms.sitemap.dom.recentMenu).css({
               top: 0,
               left: -3,
               width: cms.sitemap.dom.recentMenu.outerWidth() + 8,
               height: cms.sitemap.dom.recentMenu.outerHeight() + 1,
               border: '0px solid',
               opacity: 0.6
            });
         });
         //unnecessary
         //$(dropSelector).droppable(cms.sitemap.dropOptionsMenu);
         $('#' + cms.html.recentMenuId + ' li').draggable(cms.sitemap.dragOptionsRecent);
      },
      disable: function() {
         this.button.removeClass('ui-state-active');
         
         cms.sitemap.dom.recentMenu.css('display', 'none');
         cms.sitemap.dom.currentMenu = null;
         
      },
      
      load: function(callback) {
         cms.data.loadRecent(function(ok, data) {
            if (!ok) {
               return;
            }
            var recent = cms.sitemap.recent = data.recent;
            $('#recent_list_items').empty();
            var $recContent = buildSitemap(recent).appendTo('#recent_list_items');
            
            callback();
         });
      },
      
      init: function() {
         cms.sitemap.dom.recentMenu = $(cms.html.createMenu(cms.html.recentMenuId)).appendTo(cms.sitemap.dom.toolbarContent);
         if ($.browser.msie) {
            // vertical spacer
            $('<div/>').css('height', '1px').insertAfter(cms.sitemap.dom.recentMenu.find('.cms-scrolling'));
         }
         
      }
   }, {
      // reset mode
      name: 'reset',
      title: M.SITEMAP_MODE_RESET,
      wide: false,
      floatRight: true,
      create: createButton,
      enable: function() {
         this.button.addClass('ui-state-active');
      },
      disable: function() {
         this.button.removeClass('ui-state-active');
      },
      init: function() {
         $('button[name=reset]').live('click', function() {
            showLeaveDialog(window.location.href, M.SITEMAP_CONFIRM_RESET, M.SITEMAP_CONFIRM_RESET_TITLE);
         });
         
      }
   }, {
      // publish mode
      name: 'publish',
      title: M.SITEMAP_MODE_PUBLISH,
      wide: false,
      floatRight: true,
      create: createButton,
      enable: function() {
         var self = this;
         this.button.addClass('ui-state-active');
         cms.publish.initProjects(function() {
            var publishDialog = new cms.publish.PublishDialog();
            publishDialog.finish = function() {
               self.button.trigger('click');
            }
            publishDialog.start();
         });
      },
      disable: function() {
         this.button.removeClass('ui-state-active');
      },
      init: function() {
            }
   }];
   
   /**
    * Displays a dialog asking the user if he wants to leave the page.
    *
    * If the user clicks OK, he will be sent to the target.
    *
    * @param {Object} target the URL of the site which the user should be sent to if he clicks OK
    * @param {Object} dialogText the text of the dialog
    * @param {Object} dialogTitle the title of the dialog
    */
   var showLeaveDialog = function(target, dialogText, dialogTitle) {
      if (sitemapChanged) {
      
         $('#cms-leave-dialog').remove();
         var $dlg = $('<div id="cms-leave-dialog"></div>').appendTo('body');
         $dlg.text(dialogText);
         var buttons = {};
         
         buttons[M.SITEMAP_BUTTON_CONFIRM_LEAVE_NO] = function() {
            $dlg.dialog('destroy');
         }
         buttons[M.SITEMAP_BUTTON_CONFIRM_LEAVE_YES] = function() {
            sitemapChanged = false;
            $dlg.dialog('destroy');
            window.location.href = target;
         }
         var dlgOptions = {
            modal: true,
            zIndex: 9999,
            title: dialogTitle,
            autoOpen: true,
            buttons: buttons,
            close: function() {
               $dlg.dialog('destroy');
            }
         }
         $dlg.dialog(dlgOptions);
      } else {
         window.location.href = target;
      }
      
   }
   
   
   /**
    * Serializes a sitemap DOM element to a JSON structure
    * @param {Object} $element the DOM element representing the sitemap (wrapped in a jQuery object)
    */
   var serializeSitemap = function($element) {
      var result = [];
      $element.children('li').each(function() {
         var entry = new SitemapEntry(this);
         result.push(entry.serialize(false));
      });
      return result;
   }
   
   /**
    * Helper function that generates a callback for jQuery.each which appends its "this" argument to a given parent
    *
    * @param {Object} $parent the parent object to which the callback returned should append its argument
    */
   var actionAppendTo = function($parent) {
      return function() {
         $parent.append(this);
      }
   }
   
   var _copyObject = function(obj) {
      var result = {};
      for (var key in obj) {
         result[key] = obj[key];
         
      }
      return result;
   }
   
   var pathFieldCounter = 0;
   var makePathFieldId = function() {
      return 'cms-path-' + (pathFieldCounter++);
   }
   
   
   /**
    * Builds a DOM sitemap element from JSON sitemap entry data.
    *
    * This function also recursively processes all subentries of the entry.
    *
    * @param {Object} data a JSON object representing a sitemap entry
    */
   var _buildSitemapElement = function(data) {
      var $li = $('<li></li>').addClass(classSitemapEntry);
      //      $('.' + dropzoneClass, $li).remove();
      //      $('.' + classOpener, $li).remove();
      var isSitemap = data.properties.sitemap;
      $('<div></div>').addClass(dropzoneClass).appendTo($li);
      if (data.subentries && data.subentries.length > 0) {
         $('<span></span>').addClass(classOpener).appendTo($li);
      }
      var $item = $(data.content).appendTo($li);
      
      if (!isSitemap && data.subentries && data.subentries.length > 0) {
         $li.addClass(classSubtree);
         $li.addClass(classClosed);
         var $ul = $('<ul></ul>').appendTo($li);
         var subEntries = $.map(data.subentries, _buildSitemapElement);
         $.each(subEntries, actionAppendTo($ul));
         
      }
      var dataNode = $item.get(0);
      var isSitemap = data.properties.sitemap;
      var props = _copyObject(data.properties);
      if (isSitemap) {
         // we don't want the sitemap property to be a normal, editable property, so we store it as entry data instead
         delete props['sitemap'];
      }
      setEntryData($li, {
         properties: props,
         id: data.id,
         linkId: data.linkId,
         sitemap: isSitemap
      });
      if (isSitemap) {
         $li.addClass('cms-sub-sitemap-ref');
         var entryObj = new SitemapEntry($li);
         entryObj.setSitemap(isSitemap);
      }
      var entryObj = new SitemapEntry($li);
      // Although the title is already set by the formatter JSP, very
      // long titles aren't abbreviated, so we set it again to make sure
      // it is abbreviated.
      entryObj.setTitle(entryObj.getTitle());
      // same for the path
      entryObj.setPath(entryObj.getPath());
      
      
      return $li;
   }
   
   /**
    * Creates the button for creating a root sitemap entry in  an empty sitemap.
    *
    * @param modelEntry the entry to use as a template for newly created elements
    */
   var makeRootCreationButton = function(modelEntry) {
      var $button = $('<button/>').text(M.GUI_SITEMAP_BUTTON_CREATE_FIRST_SITEMAP_ENTRY_0).addClass('ui-state-default ui-corner-all');
      var $button = $('<button/>', {
         text: M.GUI_SITEMAP_BUTTON_CREATE_FIRST_SITEMAP_ENTRY_0,
         'class': 'ui-state-default ui-corner-all',
         css: {
            'margin-left': '10px',
            'padding': '5px'
         },
         
         click: function() {
            var $sitemapElement = _buildSitemapElement(modelEntry);
            var entryObj = new SitemapEntry($sitemapElement.get(0));
            entryObj.setPath('');
            var okCallback = function(newTitle, newUrlName, newPath, newProperties) {
               entryObj.setTitle(newTitle);
               entryObj.setUrlName(newUrlName);
               entryObj.setProperties(newProperties);
               $sitemapElement.find(cms.util.format('.{0}, .{1}', dropzoneClass, itemClass)).droppable(cms.sitemap.dropOptions);
               $sitemapElement.addClass('cms-root-sitemap');
               entryObj.setUrls('');
               entryObj.makeEditableRecursively();
               $sitemapElement.draggable(cms.sitemap.dragOptions);
               $sitemapElement.appendTo('#cms-sitemap');
               $button.remove();
               setSitemapChanged(true);
            };
            var cancelCallback = function() {
                        // do nothing
            };
            showEntryEditor(entryObj, true, [], true, okCallback, cancelCallback);
         }
      });
      $button.appendTo('#cms-main > .cms-box');
   }
   
   var TemplateSelector = function() {
      var self = this;
      self.$dom = $('<div/>');
      
      
   }
   
   TemplateSelector.prototype = {
      /**
       * Returns the selected template or null if no template is selected
       */
      getTemplate: function() {
         return null;
      },
      
      /**
       * Returns true if the template property should be inherited
       */
      shouldInherit: function() {
         return false;
      }
   };
   
   
   
   
   
   
   /**
    * AJAX handler that initializes the sitemap after loading it as JSON.
    * @param {Object} ok
    * @param {Object} data
    */
   var onLoadSitemap = cms.sitemap.onLoadSitemap = function(ok, data) {
      cms.data.newTypes = data.types;
      cms.sitemap.models = data.models;
      cms.templates = data.template;
      cms.sitemap.referencePath = data.referencePath;
      cms.sitemap.setWaitOverlayVisible(false);
      if (!ok) {
         return;
      }
      cms.sitemap.propertyDefinitions = data.properties;
      var sitemap = data.sitemap;
      var $sitemap = null;
      if (sitemap.length == 0) {
         makeRootCreationButton(cms.sitemap.models[0]);
         $sitemap = $([]);
      } else {
         $sitemap = cms.sitemap.buildSitemap(sitemap);
      }
      $sitemap.appendTo('#' + sitemapId);
      if (data.superSitemap.length == 0) {
         // this sitemap is the root sitemap if and only if it does have a super sitemap
         $('#' + sitemapId).children('.' + classSitemapEntry).addClass('cms-root-sitemap');
      }
      var $sitemapLink = _buildSitemapLink(data.superSitemap);
      $('#cms-main > .cms-box').prepend($sitemapLink);
      
      initSitemap();
      if (!cms.data.NO_EDIT_REASON) {
         $('#cms-sitemap .' + itemClass).each(function() {
            addHandles(this, sitemapModes);
         });
         initDraggable();
         $sitemap.each(function() {
            var $sitemapEntry = $(this);
            var entryObj = new SitemapEntry($sitemapEntry);
            entryObj.makeEditableRecursively();
            $(urlNameDirectInputSelector).each(function() {
               setChangeHandler($(this), handleUrlNameChange);
            });
         });
      }
      // don't display the toolbar for historical resources
      if (!cms.data.DISPLAY_TOOLBAR) {
         return;
      }
      setSitemapChanged(false);
      if (cms.data.NO_EDIT_REASON) {
         $('#toolbar_content button').addClass('cms-deactivated').unbind('click');
         // TODO: better display an red-square-icon in the toolbar with a tooltip
         cms.util.dialogAlert(cms.data.NO_EDIT_REASON, M.SITEMAP_CANT_EDIT_DIALOG_TITLE);
      }
   }
   
   
   /**
    * Builds a HTML element consisting of a link to the parent sitemap of this sitemap
    *
    * @param {String} sitemapPath the parent sitemap path
    */
   var _buildSitemapLink = function(sitemapPath) {
      if (sitemapPath.length == 0) {
         return $([]);
      }
      var $result = $('<div/>').addClass('ui-corner-all cms-sitemap-links');
      $('<div/>').text('Sitemaps referencing this sitemap: ').appendTo($result);
      var $list = $('<ul/>').appendTo($result);
      var $link = $('<a/>').attr('href', cms.data.CONTEXT + sitemapPath).text(sitemapPath);
      $('<li/>').append($link).appendTo($list);
      return $result;
   }
   
   /**
    * Builds a jQuery object containing sitemap DOM elements from a list of sitemap entry data.
    *
    * @param {Object} data the list of sitemap entries.
    */
   var buildSitemap = cms.sitemap.buildSitemap = function(data) {
      var sitemapElements = $.map(data, _buildSitemapElement);
      for (var i = 0; i < sitemapElements.length; i++) {
         sitemapElements[i].attr('sitemapIndex', i);
      }
      return $(sitemapElements);
   }
   
   var sitemapChanged = false;
   
   /**
    * Sets the "changed" status of the sitemap editor
    * @param {Boolean} changed a flag that indicates whether the sitemap should be marked as changed or unchanged
    */
   var setSitemapChanged = function(changed) {
      if (changed) {
         // Reset handles, because handles can depend on the elements they're placed in, which may have changed
         // (but only if there are handle buttons for the current mode)
         $('#' + sitemapId + ' .cms-handle').remove();
         $('#' + sitemapId + ' li div.' + itemClass).each(function() {
            addHandles(this, sitemapModes);
         });
      }
      if (!sitemapChanged && changed) {
         cms.data.sitemapPostJSON('startedit', {}, function() {
                  });
      }
      if (sitemapChanged && !changed) {
         cms.data.sitemapPostJSON('stopedit', {}, function() {
                  });
      }
      sitemapChanged = changed;
      var $saveButton = $('button[name=save]');
      if (changed) {
         $saveButton.removeClass('cms-deactivated');
      } else {
         $saveButton.addClass('cms-deactivated');
      }
   }
   
   /**
    * Gets the entry data for a sitemap entry.
    * @param {Object} $item the sitemap entry for which the entry data should be read
    */
   var getEntryData = function($item) {
      var resultStr = /*decodeURIComponent*/ ($item.attr("rel"));
      return JSON.parse(resultStr);
   }
   
   /**
    * Sets the entry data for a sitemap entry.
    * @param {Object} $item the sitemap entry
    * @param {Object} obj the entry data
    */
   var setEntryData = function($item, obj) {
      var dataStr = /*encodeURIComponent*/ (JSON.stringify(obj));
      $item.attr('rel', dataStr);
   }
   
   /**
    * Unload handler which asks the user whether he wants to save his changes.
    */
   var onUnload = function() {
      if (sitemapChanged) {
         var saveChanges = window.confirm(M.SITEMAP_CONFIRM_UNLOAD_SAVE);
         if (saveChanges) {
            cms.data.saveSitemap(serializeSitemap($('#' + sitemapId)), function() {
                        });
         } else {
            setSitemapChanged(false);
         }
      }
   }
   
   /**
    * Adds an opener and a dropzone to the DOM of a sitemap entry.
    * @param {Object} $element the DOM element, wrapped in a jQuery object
    */
   var _addOpenerAndDropzone = function($element) {
      if ($element.children('.' + classOpener).size() == 0 && $element.children('ul').size() != 0) {
         $('<span></span>').addClass(classOpener).prependTo($element);
      }
      
      if ($element.children('.' + dropzoneClass).size() == 0) {
         $('<div></div>').addClass(dropzoneClass).prependTo($element);
      }
   }
   
   /**
    * Opens  the "edit favorites" dialog.
    */
   var _editFavorites = function() {
      $('#cms-sitemap-favedit').remove();
      $('<div id="cms-sitemap-favedit"/>').appendTo('body');
      var buttons = {}
      var $dlg = $('#cms-sitemap-favedit');
      var $ul = $('<div></div>').appendTo($dlg);
      $.each(cms.sitemap.favorites, function() {
         var $smItem = _buildSitemapElement(this).addClass('cms-toplevel-entry');
         var $row = $('<div></div>').appendTo($ul)
         var $del = $('<span></span>').addClass('cms-sitemap-favdel').css('float', 'left').css('position', 'relative').css('top', '7px').width(24).height(24);
         $del.click(function() {
            $row.remove();
         });
         $del.appendTo($row);
         $('<ul/>').append($smItem).css('margin-left', '25px').appendTo($row);
         $('<div></div>').css('clear', 'both').appendTo($row);
      });
      $ul.sortable();
      buttons[M.SITEMAP_BUTTON_EDIT_FAVORITES_CANCEL] = function() {
         $dlg.dialog('destroy');
      };
      
      buttons[M.SITEMAP_BUTTON_EDIT_FAVORITES_OK] = function() {
      
         var newFav = $.map($ul.find('.cms-toplevel-entry').get(), function(sm) {
            var entry = new SitemapEntry(sm);
            return entry.serialize(false);
         });
         $dlg.dialog('destroy');
         cms.sitemap.favorites = newFav;
         cms.data.saveFavorites(function(ok, callback) {
            $('button[name=favorites].ui-state-active').trigger('click');
            // do nothing
         });
      };
      
      $('#cms-sitemap-favedit').dialog({
         autoOpen: true,
         modal: true,
         zIndex: 9999,
         resizable: true,
         width: 500,
         buttons: buttons,
         title: M.SITEMAP_EDIT_FAVORITES_TITLE
      });
   }
   
   /**
    * Enables or disables a "waiting" sign for long-running operations
    * @param {Boolean} visible enable the waiting sign if this is true, else disable it
    */
   var setWaitOverlayVisible = cms.sitemap.setWaitOverlayVisible = function(visible) {
      $('#cms-waiting-layer').remove();
      if (visible) {
         var $layer = $('<div id="cms-waiting-layer"></div>');
         $layer.appendTo('body');
         $layer.css({
            position: 'fixed',
            top: '0px',
            left: '0px',
            'z-index': 99999,
            width: '100%',
            height: '100%',
            'background-color': '#000000',
            'opacity': '0.5'
         });
         $('<img></img>').attr('src', cms.data.SKIN_URL + 'commons/wait.gif').appendTo($layer);
      }
   }
   
   var assert = function(condition, desc) {
      if (!condition) {
         throw desc;
      }
   };
   
   /**
    * Helper function that converts a constructor function to a factory function which returns the newly created object and can be used without "new".
    * @param {Object} constructor the constructor function
    */
   var wrapConstructor1 = function(constructor) {
      return function(arg) {
         return new constructor(arg);
      }
   }
   
   /**
    * Creates a permalink url from a structure id.
    *
    * @param {Object} id a structure id
    */
   var makePermalink = function(id) {
      return cms.data.CONTEXT + '/permalink/' + id;
   }
   
   
   /**
    * Constructor function for sitemap entries.
    * @param {Object} li the LI DOM element representing a sitemap entry
    */
   var SitemapEntry = function(li) {
      this.$li = $(li);
      assert(this.$li.hasClass(classSitemapEntry), "wrong element for sitemap entry");
      this.$item = this.$li.children('.' + itemClass);
   }
   
   /**
    * Prototype for the SitemapEntry class.
    *
    * This class is a wrapper around a DOM element representing a sitemap entry which can be used to conveniently set
    * or get attributes of that entry without directly using DOM manipulation functions.
    */
   SitemapEntry.prototype = {
      getChildren: function() {
         var $ul = this.$li.children('ul');
         if ($ul.size() > 0) {
            var $childrenLi = $ul.children('li');
            return $.map($childrenLi.get(), function(elem) {
               return new SitemapEntry(elem);
            });
         } else {
            return [];
         }
      },
      
      /**
       * Returns true if the sitemap entry is opened (i.e. its children are visible).
       */
      isOpen: function() {
         return !this.$li.hasClass('cms-closed');
      },
      
      /**
       * Opens or closes the sitemap entry.
       *
       * @param {Object} opened if true, the entry will be opened, else it will be closed
       */
      setOpen: function(opened) {
         if (opened) {
            this.$li.removeClass('cms-closed');
         } else {
            this.$li.addClass('cms-closed');
         }
      },
      
      /**
       * Opens or closes the whole subtree (up to a given depth) of entries starting from this entry.
       *
       *  If the depth argument is negative, the whole subtree will be opened/closed.
       *
       * @param {Object} open if open, the subtree will be opened, else closed
       * @param {Object} depth the amount of levels to open or close
       */
      openRecursively: function(open, depth) {
         var self = this;
         if (depth != 0) {
            self.setOpen(open);
            var children = self.getChildren();
            for (var i = 0; i < children.length; i++) {
               children[i].openRecursively(open, depth - 1);
            }
         }
      },
      
      /**
       * Returns the URL name of this entry.
       */
      getUrlName: function() {
         var $urlNameElem = this.$item.find('.cms-url-name');
         if ($urlNameElem.attr('nodeName') == 'INPUT') {
            return $urlNameElem.val();
         } else {
            return $urlNameElem.attr('title');
         }
      },
      
      /**
       * Sets this entry's URL name and updates the HTML.
       *
       * @param {Object} newValue the new URL name
       */
      setUrlName: function(newValue) {
         // the root of the root sitemap must always have an empty url name
         if (!this.isRootOfRootSitemap()) {
            var $urlNameElem = this.$item.find('.cms-url-name');
            if ($urlNameElem.attr('nodeName') == 'INPUT') {
               $urlNameElem.val(newValue);
            } else {
               $urlNameElem.text(newValue).attr('title', newValue);
            }
         }
      },
      
      /**
       * Returns the title of this entry.
       */
      getTitle: function() {
         return this.$item.find('h3').attr('title');
      },
      
      /**
       * Sets the title of this entry and updates the HTML.
       *
       * @param {Object} newValue the new title value
       */
      setTitle: function(newValue) {
         this.$item.find('h3').text(abbreviateTitle(newValue, 250)).attr('title', newValue);
      },
      
      /**
       * Sets the URL of this entry and updates the HTML.
       *
       * @param {Object} newValue the new URL value
       */
      setUrl: function(newValue) {
         setInfoValue(this.$item.find('span.cms-url'), newValue, 37, true);
      },
      
      /**
       * Returns the URL of this entry.
       */
      getUrl: function() {
         return this.$item.find('span.cms-url').attr('title');
      },
      
      /**
       * Recursively adjusts the URLs of the subtree starting at this sitemap entry.
       * @param {Object} parentUrl the parent url of this sitemap entry
       */
      setUrls: function(parentUrl) {
         var self = this;
         if (self.isRootOfRootSitemap()) {
            self.setUrl('/index');
            var children = self.getChildren();
            for (var i = 0; i < children.length; i++) {
               children[i].setUrls('');
            }
         } else {
            var pathName = self.getUrlName();
            self.setUrl(parentUrl + '/' + pathName);
            var children = self.getChildren();
            for (var i = 0; i < children.length; i++) {
               children[i].setUrls(parentUrl + '/' + pathName);
            }
         }
      },
      
      /**
       * Returns the id of this entry.
       */
      getId: function() {
         var entryData = getEntryData(this.$li);
         return entryData.id;
      },
      
      getAllIds: function(resultArray) {
         var self = this;
         if (!resultArray) {
            resultArray = [];
         }
         resultArray.push(this.getId());
         var children = self.getChildren();
         for (var i = 0; i < children.length; i++) {
            children[i].getAllIds(resultArray);
         }
         return resultArray;
      },
      
      
      
      
      
      /**
       * Sets the id of this entry.
       *
       * @param {Object} newValue the new id value.
       */
      setId: function(newValue) {
         var entryData = getEntryData(this.$li);
         entryData.id = newValue;
         setEntryData(this.$li, entryData);
      },
      
      /**
       * Returns the properties of this entry.
       *
       */
      getProperties: function() {
         var entryData = getEntryData(this.$li);
         return entryData.properties;
      },
      
      /**
       * Sets the properties of this entry.
       *
       * @param {Object} newValue the new properties
       */
      setProperties: function(newValue) {
         var entryData = getEntryData(this.$li);
         entryData.properties = newValue;
         setEntryData(this.$li, entryData);
      },
      
      /**
       * Merges this entry's properties with the sitemap property definitions and returns the result.
       */
      getPropertiesWithDefinitions: function() {
         var self = this;
         var propDefs = JSON.parse(JSON.stringify(cms.sitemap.propertyDefinitions));
         var props = self.getProperties();
         var propEntries = mergePropertiesWithDefinitions(propDefs, props);
         delete propEntries['sitemap'];
         return propEntries;
      },
      
      /**
       * Returns the VFS path of this entry.
       */
      getPath: function() {
         var self = this;
         return self.$item.find('.cms-vfs-path').attr('title');
      },
      
      setPath: function(path) {
         var self = this;
         self.$item.find('.cms-vfs-path').attr('title', path).text(genericAbbreviate(path, getDivWidth, 220));
      },
      
      /**
       * Returns true if this entry refers to a sub-sitemap.
       */
      isSitemap: function() {
         var entryData = getEntryData(this.$li);
         return entryData.sitemap;
      },
      
      /**
       * Sets the sub-sitemap id
       * @param {Object} newValue the new value of the sub-sitemap id
       */
      setSitemap: function(newValue) {
         this.$li.find('.' + classSubSitemapLink).remove();
         
         var entryData = getEntryData(this.$li);
         entryData.sitemap = newValue;
         setEntryData(this.$li, entryData);
         
         var $link = $('<a/>').addClass(classSubSitemapLink);
         $link.text(M.SITEMAP_LINK_GO_TO_SUBSITEMAP);
         $link.attr('href', cms.data.CONTEXT + newValue);
         $link.appendTo(this.$item.find('.' + classAdditionalInfo));
         this.$li.droppable('destroy');
      },
      
      //            /**
      //       * Sets the sub-sitemap id
      //       * @param {Object} newValue the new value of the sub-sitemap id
      //       */
      //      setSitemap: function(newValue) {
      //         this.$li.find('.' + classSubSitemapLink).remove();
      //         
      //         var entryData = getEntryData(this.$li);
      //         entryData.sitemap = newValue;
      //         setEntryData(this.$li, entryData);
      //         if (newValue || true) {
      //            var $link = $('<a/>').addClass(classSubSitemapLink);
      //            $link.text(M.SITEMAP_LINK_GO_TO_SUBSITEMAP);
      //            $link.attr('href', makePermalink(newValue));
      //            $link.appendTo(this.$item.find('.' + classAdditionalInfo));
      //            this.$li.droppable('destroy');
      //         }
      //         
      //      },
      
      
      /**
       * Returns true if this entry is the root entry of a root sitemap.
       */
      isRootOfRootSitemap: function() {
         return this.$li.hasClass('cms-root-sitemap');
      },
      
      /**
       * Recursively converts this entry and its subentries to JSON.
       * @param {Boolean} includeContent if true, the content is included in the JSON output
       * @return a JSON object describing the sitemap subtree starting from this entry
       */
      serialize: function(includeContent) {
         var self = this;
         var $li = self.$li;
         var title = self.getTitle();
         var urlName = self.getUrlName();
         var vfsPath = self.getPath();
         var children = self.getChildren();
         var childrenResults = [];
         for (var i = 0; i < children.length; i++) {
            var child = children[i];
            childrenResults.push(child.serialize(includeContent));
         }
         var properties = self.getProperties();
         properties.sitemap = self.isSitemap();
         var result = {
            title: title,
            id: self.getId(),
            linkId: self.getLinkId(),
            name: urlName,
            subentries: childrenResults,
            properties: properties
         };
         if ($li.hasClass('cms-edited-path')) {
            result.path = vfsPath;
         }
         if (includeContent) {
            var content = $('<p></p>').append(self.$item.clone()).html();
            result.content = content;
         }
         return result;
      },
      
      /**
       * Returns the resource id of this entry.
       */
      getLinkId: function() {
         var entryData = getEntryData(this.$li);
         return entryData.linkId;
      },
      
      /**
       * Sets the resource id of this entry.
       *
       * @param {Object} newValue the new resource id value.
       */
      setLinkId: function(newValue) {
         var entryData = getEntryData(this.$li);
         entryData.linkId = newValue;
         setEntryData(this.$li, entryData);
      },
      
      /**
       * Returns the URL prefix which is used to create the URLs of this entry's children.
       */
      getPrefixUrl: function() {
         var self = this;
         if (self.isRootOfRootSitemap()) {
            return '';
         } else {
            return self.getUrl();
         }
      },
      
      /**
       * Marks this sitemap entry as having a path field which has been edited.
       */
      setEditedPath: function() {
         this.$li.addClass('cms-edited-path');
      },
      
      /**
       * Makes a sitemap entry editable.
       */
      makeEditable: function() {
         var self = this;
         var $item = self.$item;
         var $li = self.$li;
         if (!$li.hasClass('cms-editable-entry')) {
            if (!self.isRootOfRootSitemap()) {
               var $urlNameField = $('.cms-url-name', $item);
               if ($urlNameField.attr('nodeName') != 'INPUT') {
                  var urlName = self.getUrlName();
                  var $newField = $('<input type="text" class="cms-item-edit cms-url-name ui-corner-all"/>');
                  $newField.insertAfter($urlNameField);
                  $urlNameField.remove();
                  self.setUrlName(urlName);
               }
            }
            var $pathField = $('.cms-additional-item[rel=path]', $li.children('.' + itemClass));
            var $pathFieldValue = $('.cms-additional-item-value', $pathField);
            var fieldId = makePathFieldId();
            $pathFieldValue.attr('id', fieldId);
            $pathFieldValue.css({
               'width': '230px',
               'overflow': 'hidden'
            });
            var $editPathButton = $('<div/>', {
               'class': 'cms-edit cms-edit-enabled',
               css: {
                  'width': '24px',
                  'height': '24px',
                  'vertical-align': 'top',
                  'float': 'right',
                  'margin-top': '-21px'
               },
               click: function() {
                  window.contextPath = cms.data.CONTEXT;
                  window.startupFolder_path = null;
                  window.startupFolders_path = null;
                  window.startupType_path = 'gallery';
                  window.resourceTypes_path = [13];
                  window.defaultAdvancedGalleryPath = (cms.data.GALLERY_PATH || cms.data.GALLERY_SERVER_URL) + '?';
                  window.galleryTabs_path = ['cms_tab_categories', 'cms_tab_galleries', 'cms_tab_search']
                  openDefaultAdvancedGallery("property", fieldId, '_path');
                  self.setEditedPath();
               }
            });
            
            $editPathButton.insertAfter($('.cms-additional-item-value', $pathField));
            var $goToPageButton = $('<div/>', {
               'class': 'cms-gotopage',
               css: {
                  'width': '24px',
                  'height': '24px',
                  'vertical-align': 'top',
                  'float': 'right',
                  'margin-top': '-21px'
               },
               click: function() {
                  var path = self.getPath();
                  var target = cms.data.CONTEXT + path;
                  goToPage(target);
               }
            });
            $goToPageButton.insertBefore($editPathButton);
         }
         $li.addClass('cms-editable-entry');
         setChangeHandler($item.find('input'), handleUrlNameChange);
      },
      
      makeEditableRecursively: function() {
         var self = this;
         self.makeEditable();
         var children = self.getChildren();
         for (var i = 0; i < children.length; i++) {
            children[i].makeEditableRecursively();
         }
      }
      
   }
   
   
   /**
    * Checks whether an object has no properties.
    * @param {Object} obj
    */
   var _isEmpty = function(obj) {
      for (var key in obj) {
         return false;
      }
      return true;
   }
   
   var makeDialogDiv = cms.property.makeDialogDiv = function(divId) {
      var $d = $('#' + divId);
      if ($d.size() == 0) {
         $d = $('<div></div>').attr('id', divId).css('display', 'none').appendTo('body');
      }
      $d.empty();
      return $d;
   }
   
   
   var editorPanelPathFieldId = 0;
   /**
    * Helper class for displaying input fields for url name and title with validation messages.
    *
    * @param {Object} isRoot flag that indicates whether the sitemap entry for which this widget is created is the root entry of a root sitemap.
    */
   var EditDialogTopPanel = function(isRoot, canEditPath) {
      var self = this;
      self.canEditPath = canEditPath;
      self.$dom = $('<div/>');
      var _rowInput = function(label) {
      
         var $row = $('<div style="margin: 3px 0px;" class="cms-editable-field cms-default-value">\
              <span class="cms-item-title cms-width-90"></span>\
              <input type="text" value="" class="cms-item-edit ui-corner-all">\
          </div>');
         $('.cms-item-title', $row).text(label);
         return $row;
      }
      
      var _rowText = function(text) {
         var $row = $('<div/>').text(text);
         return $row;
      }
      var $titleRow = _rowInput(M.SITEMAP_LABEL_EDIT_DIALOG_TITLE).appendTo(self.$dom);
      var $titleErrorRow = _rowText('').appendTo(self.$dom).hide();
      $titleErrorRow.css('color', '#ff0000');
      var $urlNameRow = _rowInput(M.SITEMAP_LABEL_EDIT_DIALOG_URLNAME).appendTo(self.$dom);
      if (isRoot) {
         $urlNameRow.find('input').get(0).disabled = true;
      }
      var $urlNameErrorRow = _rowText('').appendTo(self.$dom).hide();
      
      if (canEditPath) {
         var $pathRow = _rowInput(M.GUI_SITEMAP_LABEL_EDIT_DIALOG_PATH_0).appendTo(self.$dom);
         $pathRow.find('input').attr('readonly', 'true');
         var $pathErrorRow = _rowText('').appendTo(self.$dom).hide();
         $pathErrorRow.css('color', '#ff0000');
         
         var $pathInput = $('input', $pathRow);
         var fieldId = 'cms-edit-dialog-path' + (editorPanelPathFieldId++);
         $pathInput.attr('id', fieldId);
         
         var $editPathButton = $('<span/>', {
            'class': 'cms-edit cms-edit-enabled',
            css: {
               'width': '24px',
               'height': '24px',
               'vertical-align': 'top',
               'display': 'inline-block'
            },
            click: function() {
               window.contextPath = cms.data.CONTEXT;
               window.startupFolder_path = null;
               window.startupFolders_path = null;
               window.startupType_path = 'gallery';
               window.resourceTypes_path = [13];
               window.defaultAdvancedGalleryPath = (cms.data.GALLERY_PATH || cms.data.GALLERY_SERVER_URL) + '?';
               window.galleryTabs_path = ['cms_tab_categories', 'cms_tab_galleries', 'cms_tab_search']
               openDefaultAdvancedGallery("property", fieldId, '_path');
               self.editedPath = true;
            }
         });
         self.$pathRow = $pathRow;
         self.$pathErrorRow = $pathErrorRow;
         $editPathButton.insertAfter($pathInput);
      }
      $urlNameErrorRow.css('color', '#ff0000');
      self.$titleRow = $titleRow;
      self.$urlNameRow = $urlNameRow;
      self.$titleErrorRow = $titleErrorRow;
      self.$urlNameErrorRow = $urlNameErrorRow;
   }
   
   EditDialogTopPanel.prototype = {
      /**
       * Gets the title.
       *
       */
      getTitle: function() {
         var self = this;
         return self.$titleRow.find('input').val();
      },
      
      /**
       * Sets the title and displays it.
       *
       * @param {Object} newValue the new title
       */
      setTitle: function(newValue) {
         var self = this;
         self.$titleRow.find('input').val(newValue);
      },
      
      getPath: function() {
         var self = this;
         if (!self.canEditPath) {
            return null;
         }
         return self.$pathRow.find('input').val();
      },
      
      setPath: function(newValue) {
         var self = this;
         if (!self.canEditPath) {
            return;
         }
         self.$pathRow.find('input').val(newValue);
      },
      
      /**
       * Gets the URL name.
       *
       */
      getUrlName: function() {
         var self = this;
         return self.$urlNameRow.find('input').val();
      },
      /**
       * Sets the URL name and displays it.
       *
       * @param {Object} newValue the new URL name
       */
      setUrlName: function(newValue) {
         var self = this;
         self.$urlNameRow.find('input').val(newValue);
      },
      
      /**
       * Displays or hides an error message for the URL name field.
       *
       * If the error message is null, no error message will be shown
       *
       * @param {Object} errorMessage the error message
       */
      showUrlNameError: function(errorMessage) {
         var self = this;
         if (errorMessage) {
            self.$urlNameErrorRow.show().text(errorMessage);
         } else {
            self.$urlNameErrorRow.hide();
         }
      },
      
      /**
       * Displays or hides an error message for the title field.
       *
       * If the error message is null, no error message will be shown.
       *
       * @param {Object} errorMessage the error message
       */
      showTitleError: function(errorMessage) {
         var self = this;
         if (errorMessage) {
            self.$titleErrorRow.show().text(errorMessage);
         } else {
            self.$titleErrorRow.hide();
         }
      },
      
      /**
       * Displays or hides an error message for the path field.
       *
       * If the error message is null, no error message will be shown.
       *
       * @param {Object} errorMessage the error message
       */
      showPathError: function(errorMessage) {
      
         var self = this;
         if (!self.canEditPath) {
            return;
         }
         if (errorMessage) {
            self.$pathErrorRow.show().text(errorMessage);
         } else {
            self.$pathErrorRow.hide();
         }
      }
   }
   
   var TemplateSelector = function() {
      var self = this;
      var $dom = self.$dom = $('<span style="display: inline-block"/>');
      var makeTemplateSelectionItem = function(path, title, description, image) {
         var $item = $('<div/>');
         $item.css('margin', '2px');
         var $image = $('<img src="' + image + '"/>').css({
            'float': 'left',
            'margin-right': '3px'
         });
         $item.append($image);
         var $texts = $('<div/>').appendTo($item);
         $('<div/>').text(title).css('font-weight', 'bold').appendTo($texts);
         $('<div/>').text(description).appendTo($texts);
         $('<div/>').css('clear', 'both').appendTo($item);
         return $('<div/>').append($item).html();
      }
      
      var img1 = '/opencms/opencms/system/modules/org.opencms.frontend.template3/templates/template1.png';
      var img2 = '/opencms/opencms/system/modules/org.opencms.frontend.template3/templates/template2.png';
      var values = [{
         value: 'title_asc',
         title: makeTemplateSelectionItem('blargwarg', 'Title Title Title', 'Description Description Description Description Description', img1)
      }, {
         value: 'title_desc',
         title: makeTemplateSelectionItem('blargwarg', 'Title Title Title', 'Description Description Description Description Description', img2)
      }, {
         value: 'none',
         title: '<span>' + M.GUI_SITEMAP_NO_TEMPLATE_0 + '</span>'
      }];
      var $selectBox = $.fn.selectBox('generate', {
         useHeight: true,
         values: values,
         width: 400,
         select: function(selectbox, elem, value) {
            if (value != 'none') {
               self.$checkbox.get(0).enabled = true;
            }
         }
      });
      $selectBox.css('white-space', 'normal');
      
      $selectBox.appendTo($dom);
      $selectBox.selectBox('setValue', 'none');
      
      var $checkboxDiv = $('<div/>').css('margin-top', '5px');
      
      var $checkbox = $('<input type="checkbox" />');
      
      var $checkboxLabel = $('<span/>').text('Use for sub-pages');
      $checkboxDiv.append($checkbox).append($checkboxLabel);
      
      $checkboxDiv.insertAfter($selectBox);
      $checkboxLabel.insertAfter($checkbox);
      self.$selectBox = $selectBox;
      self.$checkbox = $checkbox;
   }
   
   TemplateSelector.prototype = {
      setProperties: function(template, templateInherit) {
         var self = this;
         if (!template || template == 'none') {
            self.$selectBox.selectBox('setValue', 'none');
            self.$checkbox.get(0).checked = false;
            self.$checkbox.get(0).disabled = true;
         } else {
            self.$checkbox.get(0).disabled = false;
            self.$selectBox.selectBox('setValue', template);
            self.$checkbox.get(0).checked = (templateInherit == template);
         }
         
      },
      
      getProperties: function() {
         var self = this;
         var result = {};
         var value = self.$selectBox.selectBox('getValue');
         if (value != 'none') {
            result['template'] = value;
            if (self.$checkbox.get(0).checked) {
               result['template-inherit'] = value;
            }
         }
         return result;
      }
   }
   
   
   /**
    * Displays the property editor.
    *
    * @param entry the sitemap entry object to edit
    * @param writeData if true, the values from the edit dialog will be written into the sitemap entry passed as the first parameter
    * @param otherUrlNames an object containing the url names at the same level as the sitemap entry being edited
    * @param callback the callback which is called if the user clicks OK
    * @param cancelCallback the callback which is called if the user clicks Cancel
    */
   var showEntryEditor = cms.sitemap.showEntryEditor = function(entry, writeData, otherUrlNames, canEditPath, callback, cancelCallback) {
      var title = entry.getTitle();
      var urlName = entry.getUrlName();
      var path = entry.getPath();
      var properties = entry.getPropertiesWithDefinitions();
      var widgets = {};
      var newProps = {};
      //var template = properties['template'].value || null;
      //var templateInherit = properties['template-inherit'].value || null;
      delete properties['template'];
      delete properties['template-inherit'];
      
      var $table = cms.property.buildPropertyTable(properties, widgets);
      var $dlg = makeDialogDiv('cms-property-dialog');
      $dlg.addClass('cms-validation');
      var isRoot = entry.isRootOfRootSitemap();
      var topPanel = new EditDialogTopPanel(isRoot, canEditPath);
      
      topPanel.setTitle(title);
      topPanel.setUrlName(urlName);
      topPanel.setPath(path);
      topPanel.$dom.appendTo($dlg);
      
      //      var $templateField = $('<div class="cms-editable-field cms-default-value">\
      //      <span class="cms-item-title cms-width-90">' + M.GUI_SITEMAP_LABEL_TEMPLATE_0 + '</span>\
      //      </div>');
      //      var templateSelector = new TemplateSelector();
      //      $templateField.find('.cms-item-title').css('vertical-align', 'top');
      //      $templateField.find('.cms-item-title').after(templateSelector.$dom);
      //      //$templateField.appendTo($dlg);
      //      var templateFieldWidth = $templateField.width();
      //      templateSelector.setProperties(template, templateInherit);
      
      $('<hr/>').css({
         'margin-top': '15px',
         'margin-bottom': '15px',
         'color': '#aaaaaa'
      }).appendTo($dlg);
      $('<div></div>').css('font-weight', 'bold').text(M.SITEMAP_LABEL_EDIT_DIALOG_PROPERTIES).appendTo($dlg);
      
      $dlg.append($table);
      
      var _destroy = function() {
         $dlg.dialog('destroy');
      }
      
      var buttons = {};
      buttons[M.SITEMAP_BUTTON_EDIT_DIALOG_CANCEL] = function() {
         _destroy();
         if (cancelCallback) {
            cancelCallback();
         }
      };
      var options = {
         title: M.SITEMAP_EDIT_DIALOG_TITLE,
         modal: true,
         autoOpen: true,
         width: 550,
         zIndex: 9999,
         close: _destroy,
         buttons: buttons
      }
      
      $dlg.dialog(options);
      
      // align middle columns of both tables
      //      var colOffset1 = $table.find('td:eq(1)').position().left;
      //      var colOffset2 = topPanel.$dom.find('td:eq(1)').position().left;
      //      if (colOffset1 > colOffset2) {
      //         topPanel.$dom.css('margin-left', (colOffset1 - colOffset2) + 'px');
      //      } else {
      //         $table.css('margin-left', (colOffset2 - colOffset1) + 'px');
      //      }
      
      
      var $ok = $('<button></button>').addClass('ui-corner-all').addClass('ui-state-default').text(M.SITEMAP_BUTTON_EDIT_DIALOG_OK);
      
      var _validateAll = function(validationCallback) {
         var result = true;
         cms.property.setDialogButtonEnabled($ok, false);
         var urlName = topPanel.getUrlName();
         var path = topPanel.getPath();
         var urlNameError = null;
         var hasUrlNameError = false;
         cms.data.convertUrlName(urlName, function(newUrlName) {
            var titleError = null;
            if (topPanel.getTitle() == '') {
               titleError = M.SITEMAP_ERROR_EDIT_DIALOG_TITLE_MUST_NOT_BE_EMPTY;
               result = false;
            }
            topPanel.showTitleError(titleError);
            
            if (canEditPath) {
               var pathError = null;
               if (path == '') {
                  pathError = M.ERR_SITEMAP_EDIT_DIALOG_PATH_CANT_BE_EMPTY_0;
                  result = false;
               }
               topPanel.showPathError(pathError);
            }
            
            
            if (!isRoot) {
               // no url name validation for the root entry of root sitemaps 
               var isDuplicate = otherUrlNames[newUrlName];
               hasUrlNameError = isDuplicate || (urlName != newUrlName)
               if (isDuplicate && (urlName != newUrlName)) {
                  urlNameError = cms.util.format(M.SITEMAP_ERROR_EDIT_DIALOG_TRANSLATED_URLNAME_EXISTS_1, urlName);
               } else if (isDuplicate) {
                  urlNameError = M.SITEMAP_ERROR_EDIT_DIALOG_URLNAME_EXISTS;
               } else if (urlName != newUrlName) {
                  urlNameError = cms.util.format(M.SITEMAP_ERROR_EDIT_DIALOG_URLNAME_TRANSLATED_1, urlName);
               }
               topPanel.setUrlName(newUrlName);
               topPanel.showUrlNameError(urlNameError);
               if (hasUrlNameError) {
                  result = false;
               }
            }
            for (var key in widgets) {
               if (!widgets[key].validate()) {
                  result = false;
               }
            }
            if (validationCallback) {
               validationCallback(result);
            }
         });
      }
      
      function _validationCallback(ok) {
         cms.property.setDialogButtonEnabled($ok, ok);
      }
      
      _validateAll(_validationCallback);
      
      
      $dlg.click(function() {
         _validateAll(_validationCallback);
         return true;
      });
      $dlg.nextAll().click(function() {
         _validateAll(_validationCallback);
      });
      
      $dlg.bind('validation', function() {
         _validateAll(_validationCallback);
      });
      
      
      $dlg.keydown(function(e) {
         // user pressed Tab or Enter
         if (e.keyCode == 9 || e.keyCode == 13) {
            _validateAll(_validationCallback);
         }
      });
      
      $ok.click(function() {
         _validateAll(function(ok) {
            cms.property.setDialogButtonEnabled($ok, ok);
            if (ok) {
               _destroy();
               for (widgetName in widgets) {
                  widgets[widgetName].save(newProps);
               }
               //               var templateProps = templateSelector.getProperties();
               //               for (var templateName in templateProps) {
               //                  newProps[templateName] = templateProps[templateName];
               //               }
               if (writeData) {
                  entry.setTitle(topPanel.getTitle());
                  entry.setUrlName(topPanel.getUrlName());
                  if (canEditPath && topPanel.editedPath) {
                     entry.setPath(topPanel.getPath());
                     entry.setEditedPath();
                  }
                  
                  entry.setProperties(newProps);
               }
               callback(topPanel.getTitle(), topPanel.getUrlName(), topPanel.editedPath ? topPanel.getPath() : null, newProps);
            }
         });
      });
      $dlg.nextAll('.ui-dialog-buttonpane').append($ok);
   }
   /**
    * Helper function for measuring the width of a sitemap entry title.
    *
    * @param {Object} title the sitemap entry title
    * @return the width of the title
    *
    */
   var getEntryTitleWidth = function(title) {
      var $div = $('<div/>', {
         'class': 'cms-sitemap-item',
         css: {
            'height': 'auto',
            'width': 'auto',
            'position': 'absolute',
            'visibility': 'hidden'
         }
      }).append($('<h3/>').text(title));
      $div.appendTo('body');
      var width = $div.get(0).clientWidth + 1;
      $div.remove();
      return width;
   }
   
   /**
    * Helper function for measuring the width of a given text when put into a div element and placed in the document.
    *
    * @param {Object} text the text for which the width should be measured
    */
   var getDivWidth = function(text) {
      var $div = $('<div/>', {
         css: {
            'height': 'auto',
            'width': 'auto',
            'position': 'absolute',
            'visibility': 'hidden'
         }
      });
      $div.text(text);
      $div.appendTo('body');
      var width = $div.get(0).clientWidth + 1;
      $div.remove();
      return width;
   }
   
   /**
    * Function to abbreviate a sitemap entry title.
    *
    * @param {Object} title the sitemap entry title
    * @param {Object} maxWidth the maximum width
    * @return the abbreviated sitemap entry title
    */
   var abbreviateTitle = function(title, maxWidth) {
      return genericAbbreviate(title, getEntryTitleWidth, maxWidth);
   }
   
   /**
    * Generic text abbreviation function.
    *
    * @param {Object} text the text to abbreviate
    * @param {Object} getWidth the function to measure the width of a text
    * @param {Object} maxWidth the maximum width
    * @return the original text if it's shorter than maxWidth, or an abbreviated string which consists of a prefix of the original text combined with '...'
    */
   var genericAbbreviate = function(text, getWidth, maxWidth) {
      var shortened = false;
      while (getWidth(text) > maxWidth) {
         text = text.substr(0, text.length - 1);
         shortened = true;
      }
      if (shortened) {
         text = text + '...';
      }
      return text;
   }
   
   /** 
    * Removes duplicate slashes from a string (which may occur after concatenating paths).
    *
    * @param {String} uri the path to remove duplicate slashes from
    * @return the string with duplicate slashes removed
    */
   var removeDuplicateSlashes = function(uri) {
      return uri.replace(/\/+/g, '/');
   }
   
})(cms);
