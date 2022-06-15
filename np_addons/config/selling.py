from __future__ import unicode_literals
from frappe import _

def get_data():
	return [
		{
			"label": _("Sales"),
			"items": [
				{
					"type": "page",
					"label": _("NP Status"),
					"name": "np-status",
					"description": _("Summary"),
					"data_doctype": "Sales Order"
				},
			]
		},
		
		
		
	]
