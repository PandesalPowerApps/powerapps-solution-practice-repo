var SimpleCatalog = SimpleCatalog || {};
SimpleCatalog.Relationship = (function () {
  "use strict";
  function updateName(context) {
    var form = context.getFormContext();
    var product = form.getAttribute("practmp_productid").getValue();
    var location = form.getAttribute("practmp_locationid").getValue();
    var name = form.getAttribute("practmp_productlocationjoin1");
    if (product && product.length && location && location.length) {
      var value = product[0].name + " at " + location[0].name;
      var limit = name.getMaxLength();
      name.setValue(limit ? value.slice(0, limit) : value);
      name.setSubmitMode("always");
    }
  }
  function onLoad(context) {
    var form = context.getFormContext();
    ["practmp_productid", "practmp_locationid"].forEach(function (key) {
      var attribute = form.getAttribute(key);
      attribute.removeOnChange(updateName);
      attribute.addOnChange(updateName);
      attribute.setRequiredLevel("required");
    });
    form.getAttribute("practmp_productlocationjoin1").controls.forEach(function (control) { control.setDisabled(true); });
    if (form.ui.getFormType() === 1) { updateName(context); }
  }
  return { onLoad: onLoad };
}());
