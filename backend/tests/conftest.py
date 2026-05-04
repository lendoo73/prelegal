import pathlib
import tempfile

import pytest

import app.database as db_module


@pytest.fixture(autouse=True, scope="session")
def setup_test_database(tmp_path_factory):
    tmp_dir = tmp_path_factory.mktemp("data")
    test_db = tmp_dir / "test.db"
    original = db_module.DB_PATH
    db_module.DB_PATH = test_db
    db_module.init_db()
    yield
    db_module.DB_PATH = original
