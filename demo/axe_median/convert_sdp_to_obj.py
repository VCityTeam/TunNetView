import argparse
from add_line_obj_skel import addLine

# Parse command line arguments
argParser = argparse.ArgumentParser(description='Take skeleton file in input and generate onj in output')
argParser.add_argument('fileInput')
argParser.add_argument('fileOutput')
args = argParser.parse_args()


def checkExtension(filename, expected_extension):
    return filename.lower().endswith(expected_extension.lower())

outputFilePath = args.fileOutput
if not checkExtension(args.fileOutput, ".obj"):
     outputFilePath+= '.obj'

# Read from input file and write to output file
with open(args.fileInput, 'r') as inFile:
    lines = inFile.readlines()
    with open(outputFilePath, 'w') as outFile:
        for line in lines:
            outFile.write(f'v {line}')
        addLine(lines, outFile)
