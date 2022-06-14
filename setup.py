# -*- coding: utf-8 -*-
from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in np_addons/__init__.py
from np_addons import __version__ as version

setup(
	name="np_addons",
	version=version,
	description="NP",
	author="Mohammad Ali",
	author_email="swe.mirza.ali@gmail.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
