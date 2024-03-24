module.exports = async (waw) => {
	const addOperatorIds = async (req, res, next) => {
		if (!req.user || (!req.user.is.admin && !req.user.is.operator)) {
			res.json(false);
		} else {
			req.operatorIds = (
				await waw.Operator.find(
					req.user.is.admin
						? {}
						: {
								author: req.user._id,
						  }
				).select("_id")
			).map((o) => o._id);
			next();
		}
	};

	waw.crud("operatorpage", {
		create: {
			ensure: waw.role("admin operator", async (req, res, next) => {
				if (req.user.is.admin) {
					next();
				} else {
					const operatorIds = (
						await waw.Operator.find({
							author: req.user._id,
						}).select("_id")
					).map((o) => o._id);

					if (operatorIds.indexOf(req.body.operator) > -1) {
						next();
					} else {
						res.json(false);
					}
				}
			}),
		},
		get: {
			ensure: addOperatorIds,
			query: (req) => {
				return req.operatorIds
					? {
							operator: req.operatorIds,
					  }
					: {};
			},
		},
		fetch: {
			ensure: waw.role("admin"),
			query: (req) => {
				return {
					_id: req.body._id,
				};
			},
		},
		update: {
			ensure: addOperatorIds,
			query: (req) => {
				return req.operatorIds
					? {
							_id: req.body._id,
							operator: req.operatorIds,
					  }
					: {
							_id: req.body._id,
					  };
			},
		},
		delete: {
			ensure: waw.role("admin"),
			query: (req) => {
				return {
					_id: req.body._id,
				};
			},
		},
	});
};
