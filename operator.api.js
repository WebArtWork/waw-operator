module.exports = async (waw) => {
	waw.crud("operator", {
		create: {
			ensure: waw.role("admin"),
		},
		get: {
			ensure: waw.role("admin operator"),
			query: (req) => {
				return req.user.is.admin
					? {}
					: {
							author: req.user._id,
					  };
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
		update: [
			{
				ensure: waw.role("admin"),
				query: (req) => {
					return {
						_id: req.body._id,
					};
				},
			},
			{
				name: "operator",
				ensure: waw.role("operator admin"),
				query: (req) => {
					return req.user.is.admin
						? {
								_id: req.body._id,
						  }
						: {
								_id: req.body._id,
								author: req.user._id,
						  };
				},
			},
		],
		delete: {
			ensure: waw.role("admin"),
			query: (req) => {
				return {
					_id: req.body._id,
				};
			},
		},
	});

	await waw.wait(2000);
	waw.setUnique("subdomain", async (subdomain) => {
		const operators = await waw.Operator.find({
			domain: {
				$exists: true,
			},
		}).select("domain");

		for (const operator of operators) {
			if (
				!!(await waw.Operator.count({
					domain: subdomain + "." + operator.domain,
				}))
			) {
				return true;
			}
		}
		return false;
	});
};
