dev-deps:
		python3 -m venv venv
		./venv/bin/pip install -r requirements.txt

dev-aws-setup:
		./dev-aws-setup.sh

dev-release:
		set -o allexport; source .env; ./venv/bin/python release.py

dev-dump:
		set -o allexport; source .env; ./venv/bin/python ./dev/dump_mock_data.py

test:
		./venv/bin/nosetests
