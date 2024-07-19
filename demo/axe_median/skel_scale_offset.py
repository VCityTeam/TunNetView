#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import argparse
from add_line_obj_skel import addLine

#######################################################################

# parse command line arguments
argParser = argparse.ArgumentParser(description='Apply scale and offset to input file.')
argParser.add_argument('filepath')
argParser.add_argument('scale', type=float)
argParser.add_argument('offset_x', type=float)
argParser.add_argument('offset_y', type=float)
argParser.add_argument('offset_z', type=float)
args = argParser.parse_args()

outputfilepath = args.filepath + '.scaled.obj'

with open(args.filepath, 'r') as infile:
    with open(outputfilepath, 'w') as outfile:
        lines = infile.readlines()
        for i, line in enumerate(lines):
            x, y, z = line.split()
            x = float(x) / args.scale - args.offset_x
            y = float(y) / args.scale - args.offset_y
            z = float(z) / args.scale - args.offset_z
            outfile.write(f'v {x} {y} {z}\n')
        
        addLine(args.filepath, outfile, args.scale, args.offset_x, args.offset_y, args.offset_z)